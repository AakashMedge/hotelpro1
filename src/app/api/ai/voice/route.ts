import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

        if (!ELEVENLABS_API_KEY) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        // DYNAMIC VOICE SELECTION (Bulletproof)
        // 1. Fetch available voices to ensure we use a valid ID
        const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY }
        });

        let selectedVoiceId = 'JBFqnCBsd6RMkjVDRZzb'; // Default George

        if (voicesResponse.ok) {
            const data = await voicesResponse.json();
            if (data.voices && data.voices.length > 0) {
                // Use the first available voice to guarantee success
                selectedVoiceId = data.voices[0].voice_id;
                console.log("Using Dynamic Voice ID:", selectedVoiceId);
            }
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`, {
            method: 'POST',
            headers: {
                'accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_turbo_v2_5', // Use Turbo 2.5
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.8,
                }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("ElevenLabs Error Detail:", errorBody);
            throw new Error(`ElevenLabs API failed: ${errorBody}`);
        }

        const audioBuffer = await response.arrayBuffer();

        return new Response(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } catch (error) {
        console.error('Voice Processing Error:', error);
        return NextResponse.json({ error: 'Failed to generate voice' }, { status: 500 });
    }
}
