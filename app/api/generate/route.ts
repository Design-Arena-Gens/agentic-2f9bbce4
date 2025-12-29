import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const prompt = formData.get('prompt') as string;
    const duration = formData.get('duration') as string;
    const imageFile = formData.get('image') as File | null;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    let output: any;

    if (type === 'text-to-image') {
      output = await replicate.run(
        'black-forest-labs/flux-1.1-pro' as any,
        {
          input: {
            prompt: prompt,
            aspect_ratio: '16:9',
            output_format: 'png',
            output_quality: 100,
          },
        }
      );
    } else if (type === 'text-to-video') {
      const durationNum = parseInt(duration) || 30;
      const frames = Math.floor(durationNum * 8);

      output = await replicate.run(
        'lightricks/ltx-video:03b88e6afdce86d3d93fb9826a9c33b891d81b7a0fc95dd3e5ae5d9aef22b82b' as any,
        {
          input: {
            prompt: prompt,
            num_frames: frames,
            aspect_ratio: '16:9',
            negative_prompt: 'worst quality, low quality, blurry, distorted, artifacts',
          },
        }
      );
    } else if (type === 'image-to-image') {
      if (!imageFile) {
        return NextResponse.json(
          { error: 'Image file is required for image-to-image generation' },
          { status: 400 }
        );
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

      output = await replicate.run(
        'black-forest-labs/flux-1.1-pro' as any,
        {
          input: {
            prompt: prompt,
            image: base64Image,
            prompt_strength: 0.8,
            aspect_ratio: '16:9',
            output_format: 'png',
            output_quality: 100,
          },
        }
      );
    }

    const resultUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({ output: resultUrl });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
