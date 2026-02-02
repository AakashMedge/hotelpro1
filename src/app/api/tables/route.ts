/**
 * Tables API
 * 
 * GET /api/tables - Get all tables with their status
 * GET /api/tables/[tableCode] - Get a specific table by code
 * 
 * Public endpoint for QR-based ordering.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface TableResponse {
    id: string;
    tableCode: string;
    capacity: number;
    status: string;
}

interface TablesListResponse {
    success: boolean;
    tables?: TableResponse[];
    error?: string;
}

/**
 * GET /api/tables
 * 
 * Get all tables with their current status.
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<TablesListResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const tableCode = searchParams.get("code");

        let where: any = { deletedAt: null };
        if (tableCode) {
            // Smart Matching: Handle "4", "04", and "T-04"
            const paddedCode = tableCode.padStart(2, '0');
            where = {
                deletedAt: null,
                OR: [
                    { tableCode: { equals: tableCode, mode: 'insensitive' } },
                    { tableCode: { equals: `T-${tableCode}`, mode: 'insensitive' } },
                    { tableCode: { equals: `T-${paddedCode}`, mode: 'insensitive' } },
                    { tableCode: { equals: paddedCode, mode: 'insensitive' } }
                ]
            };
        }

        const tables = await prisma.table.findMany({
            where,
            include: {
                orders: {
                    where: {
                        status: {
                            notIn: ["CLOSED"]
                        }
                    },
                    select: {
                        id: true,
                        customerName: true,
                        sessionId: true,
                        status: true,
                    },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: {
                tableCode: "asc",
            },
        });

        // Map and ensure capacity exists
        const formattedTables = tables.map(t => ({
            id: t.id,
            tableCode: t.tableCode,
            capacity: (t as any).capacity ?? 4,
            status: t.status,
            activeOrder: t.orders[0] || null,
            assignedWaiterId: t.assignedWaiterId,
        }));

        return NextResponse.json({
            success: true,
            tables: formattedTables as any,
        });
    } catch (error) {
        console.error("[TABLES API] Error fetching tables:", error);

        return NextResponse.json(
            { success: false, error: "Failed to fetch tables" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tables
 * Create a new table
 */
import { requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        await requireRole(["MANAGER", "ADMIN"]);
        const { tableCode, capacity } = await request.json();

        if (!tableCode || !capacity) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        const existing = await prisma.table.findUnique({ where: { tableCode } });
        if (existing) {
            return NextResponse.json({ success: false, error: "Table Code exists" }, { status: 409 });
        }

        const table = await prisma.table.create({
            data: {
                tableCode,
                capacity: Number(capacity),
                status: "VACANT"
            }
        });

        return NextResponse.json({ success: true, table });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create table" }, { status: 500 });
    }
}
