import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const outputDir = '/home/z/my-project/public/faq-images';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateImage(prompt: string, outputPath: string, size: string = '1344x768') {
  const zai = await ZAI.create();
  console.log(`Generating: ${path.basename(outputPath)}...`);
  const response = await zai.images.generations.create({ prompt, size });
  const buffer = Buffer.from(response.data[0].base64, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Done: ${path.basename(outputPath)} (${buffer.length} bytes)`);
}

async function main() {
  const images = [
    {
      name: 'student-join.png',
      prompt: 'Clean modern UI mockup showing a simple student join screen for an online tutoring whiteboard app. A minimal dialog box says "Enter your name to join" with a text field and green "Join Lesson" button. Soft gradient background in teal and white. Flat design style, professional SaaS product interface, no people, just the UI elements floating on a clean background.',
      size: '1344x768'
    },
    {
      name: 'whiteboard-canvas.png',
      prompt: 'Professional screenshot of a modern collaborative whiteboard application interface. The canvas shows math equations, geometric shapes, hand-drawn diagrams in multiple colors, a toolbar on the left with drawing tools, and small user avatar circles at the top showing real-time collaboration. Clean design, light background, colorful annotations. Educational technology product.',
      size: '1344x768'
    },
    {
      name: 'ai-quiz.png',
      prompt: 'Clean UI mockup of an AI-powered quiz generator panel inside a tutoring whiteboard app. Shows a side panel with "Generate Quiz" button, multiple choice questions appearing, and a student score tracker. Modern SaaS design, soft green accents, educational technology feel. Professional flat design style.',
      size: '1344x768'
    },
    {
      name: 'video-tutoring.png',
      prompt: 'Split-screen layout showing a tutoring session: on the left is a collaborative whiteboard with math problems, on the right is a small video call window with a tutor and student. Small floating toolbar at the bottom. Modern educational technology interface, clean design, soft blue and green accents. Professional product mockup.',
      size: '1344x768'
    },
    {
      name: 'agency-dashboard.png',
      prompt: 'Professional dashboard UI for a tutoring agency management platform. Shows analytics cards at the top (total students, active tutors, revenue, lessons this week), a weekly calendar view with scheduled lessons, and a student progress sidebar. Modern data visualization with charts. Clean SaaS design, dark sidebar, emerald green accent colors.',
      size: '1344x768'
    },
    {
      name: 'subject-toolkit.png',
      prompt: 'UI mockup showing subject-specific toolkits for an educational whiteboard. Four icon groups: Math (calculator, graph, geometry tools), Science (beaker, atom, periodic table), Language (ABC, grammar, vocabulary), General (shapes, sticky notes, timer). Clean card-based layout, colorful icons, modern flat design. Educational technology product interface.',
      size: '1344x768'
    },
    {
      name: 'recording-playback.png',
      prompt: 'UI mockup of a lesson recording playback screen for a tutoring platform. Shows a video timeline at the bottom, a whiteboard canvas in the center displaying lesson content, and a sidebar with lesson notes and timestamps. Clean modern design, professional SaaS product, soft emerald green accents.',
      size: '1344x768'
    },
    {
      name: 'parent-portal.png',
      prompt: 'Clean mobile-responsive UI mockup of a parent portal for a tutoring platform. Shows upcoming lesson schedule, student progress indicators (reading, math, science progress bars), attendance record, and a "Message Tutor" button. Warm friendly design, soft colors, modern educational technology product. Professional flat design style.',
      size: '1344x768'
    }
  ];

  // Generate in batches of 3 (parallel)
  for (let i = 0; i < images.length; i += 3) {
    const batch = images.slice(i, i + 3);
    await Promise.all(
      batch.map(img =>
        generateImage(
          img.prompt,
          path.join(outputDir, img.name),
          img.size
        ).catch(err => {
          console.error(`Failed ${img.name}: ${err.message}`);
        })
      )
    );
    console.log(`Batch ${Math.floor(i / 3) + 1} complete`);
  }

  console.log('All FAQ images generated!');
}

main().catch(console.error);
