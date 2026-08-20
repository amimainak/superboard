// ============================================================
// Vocabulary Cards — organized by grade band and POS
// Architecture: data-file-based, consumed by unified widget
// ============================================================

export type PosTag = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'other'
export type CardLevel = 'K-5' | '6-8' | '9-12'

export interface VocabCard {
  id: string
  word: string
  definition: string
  example: string
  pos: PosTag
  level: CardLevel
  masteryCount?: number
  lastSeen?: number
}

export const VOCAB_CARDS: VocabCard[] = [
  // K-5 Nouns
  { id: 'v-k5-n-001', word: 'Courage', definition: 'Bravery; the ability to do something even when scared', example: 'It took courage to speak in front of the class.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-002', word: 'Journey', definition: 'A long trip from one place to another', example: 'The journey across the mountains took three days.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-003', word: 'Neighbor', definition: 'A person who lives near you', example: 'Our neighbor brought us cookies.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-004', word: 'Treasure', definition: 'Something very valuable or precious', example: 'The pirates found a chest full of treasure.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-005', word: 'Garden', definition: 'A piece of ground where flowers or vegetables are grown', example: 'We planted tomatoes in the garden.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-006', word: 'Library', definition: 'A place where books are kept for people to borrow or read', example: 'She goes to the library every Saturday.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-007', word: 'Weather', definition: 'The condition of the air outside, such as rain, sun, or wind', example: 'The weather was sunny and warm today.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-008', word: 'Mystery', definition: 'Something that is hard to explain or understand', example: 'The missing keys remained a mystery.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-009', word: 'Recipe', definition: 'A set of instructions for making a food dish', example: 'We followed the recipe to bake chocolate chip cookies.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-010', word: 'Shadow', definition: 'A dark shape made when something blocks light', example: 'My shadow got longer as the sun went down.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-011', word: 'Bridge', definition: 'A structure built over a river or road for crossing', example: 'We drove across the bridge to get to the other side.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-012', word: 'Language', definition: 'The words people use to communicate with each other', example: 'She is learning a new language at school.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-013', word: 'Volcano', definition: 'A mountain that can erupt, sending out hot lava and ash', example: 'The scientists studied the active volcano.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-014', word: 'Companion', definition: 'A person or animal that spends time with you', example: 'The dog was a loyal companion to the old man.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-015', word: 'Harvest', definition: 'The time when crops are gathered from the fields', example: 'The farmers celebrated a good harvest this year.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-016', word: 'Spectacle', definition: 'An amazing or unusual sight to see', example: 'The fireworks display was a wonderful spectacle.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-017', word: 'Paragraph', definition: 'A group of sentences about one main idea', example: 'Each paragraph in the essay starts with a topic sentence.', pos: 'noun', level: 'K-5' },
  { id: 'v-k5-n-018', word: 'Excuse', definition: 'A reason given to explain why you did something', example: 'He made up an excuse for being late.', pos: 'noun', level: 'K-5' },

  // K-5 Verbs
  { id: 'v-k5-v-001', word: 'Explore', definition: 'To travel to or around a new place to learn about it', example: 'The scientists will explore the deep ocean.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-002', word: 'Imagine', definition: 'To form a picture in your mind', example: 'Imagine a world where everyone is kind.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-003', word: 'Scamper', definition: 'To run with quick, short steps', example: 'The squirrels scamper across the yard every morning.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-004', word: 'Whisper', definition: 'To speak very softly', example: 'Please whisper so you do not wake the baby.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-005', word: 'Observe', definition: 'To watch or look at something carefully', example: 'We observed the butterflies in the garden.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-006', word: 'Discover', definition: 'To find or learn something for the first time', example: 'Scientists discover new species every year.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-007', word: 'Create', definition: 'To make something new', example: 'She loves to create art with paint and clay.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-008', word: 'Struggle', definition: 'To try hard to do something difficult', example: 'He struggled with the math problem for a long time.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-009', word: 'Giggle', definition: 'To laugh in a silly, quiet way', example: 'The girls giggled at the funny cartoon.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-010', word: 'Shimmer', definition: 'To shine with a soft, wavering light', example: 'The lake shimmered under the moonlight.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-011', word: 'Pledge', definition: 'To promise to do something', example: 'We pledge to keep the playground clean.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-012', word: 'Gaze', definition: 'To look at something for a long time', example: 'She gazed at the stars in the night sky.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-013', word: 'Collaborate', definition: 'To work together with others on a project', example: 'The students collaborated to build a science fair project.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-014', word: 'Solve', definition: 'To find the answer to a problem', example: 'Can you solve this puzzle before lunch?', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-015', word: 'Wander', definition: 'To walk around without a clear direction', example: 'We wandered through the forest looking for the trail.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-016', word: 'Explain', definition: 'To make something clear or easy to understand', example: 'Can you explain how you got your answer?', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-017', word: 'Arrange', definition: 'To put things in a certain order or position', example: 'She arranged the flowers in a vase.', pos: 'verb', level: 'K-5' },
  { id: 'v-k5-v-018', word: 'Celebrate', definition: 'To do something special to show joy for an event', example: 'We celebrate birthdays with cake and presents.', pos: 'verb', level: 'K-5' },

  // K-5 Adjectives
  { id: 'v-k5-a-001', word: 'Curious', definition: 'Eager to know or learn something', example: 'The curious cat explored every corner of the room.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-002', word: 'Enormous', definition: 'Very large in size or amount', example: 'The enormous elephant drank from the river.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-003', word: 'Gentle', definition: 'Kind and soft; not rough or harsh', example: 'She gave the kitten a gentle pat.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-004', word: 'Sparkling', definition: 'Shining with small flashes of light', example: 'The sparkling river reflected the sunlight.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-005', word: 'Bitter', definition: 'Having a sharp, unpleasant taste or feeling', example: 'The medicine had a bitter taste.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-006', word: 'Grateful', definition: 'Feeling thankful for something good', example: 'I am grateful for my friends and family.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-007', word: 'Fragile', definition: 'Easily broken or damaged', example: 'Handle the fragile glass with care.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-008', word: 'Ancient', definition: 'Very old; from a long time ago', example: 'We learned about ancient Egypt in social studies.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-009', word: 'Peaceful', definition: 'Calm and quiet; not disturbed', example: 'The lake was peaceful in the early morning.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-010', word: 'Clumsy', definition: 'Moving in an awkward way; likely to trip or drop things', example: 'The clumsy puppy knocked over the water bowl.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-011', word: 'Delicious', definition: 'Very pleasant to taste or smell', example: 'Grandma made a delicious dinner for us.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-012', word: 'Loyal', definition: 'Faithful and sticking by someone', example: 'A loyal friend will always help you.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-013', word: 'Mysterious', definition: 'Hard to understand or explain; full of secrets', example: 'The mysterious footsteps in the hall scared us.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-014', word: 'Proud', definition: 'Feeling good about something you or someone else did', example: 'She felt proud when she won the spelling bee.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-015', word: 'Fierce', definition: 'Very strong, powerful, or angry', example: 'The fierce wind blew the roof off the barn.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-016', word: 'Brilliant', definition: 'Very bright, clever, or talented', example: 'The scientist had a brilliant idea.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-017', word: 'Colorful', definition: 'Having many bright or different colors', example: 'The artist painted a colorful mural on the wall.', pos: 'adj', level: 'K-5' },
  { id: 'v-k5-a-018', word: 'Gloomy', definition: 'Dark and sad; not cheerful', example: 'The gloomy weather made everyone want to stay inside.', pos: 'adj', level: 'K-5' },

  // K-5 Adverbs
  { id: 'v-k5-d-001', word: 'Carefully', definition: 'In a way that avoids danger or mistakes', example: 'She carefully carried the glass of water.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-002', word: 'Quickly', definition: 'In a fast way; with speed', example: 'He quickly finished his homework.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-003', word: 'Silently', definition: 'In a way that makes no sound', example: 'The cat silently crept up on the mouse.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-004', word: 'Eagerly', definition: 'In a way that shows excitement or want', example: 'The students eagerly opened their new books.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-005', word: 'Gently', definition: 'In a soft and careful way', example: 'He gently stroked the sleeping puppy.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-006', word: 'Suddenly', definition: 'Happening in a quick, unexpected way', example: 'Suddenly, the lights went out.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-007', word: 'Cheerfully', definition: 'In a happy and positive way', example: 'She cheerfully greeted everyone at the door.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-008', word: 'Nervously', definition: 'In a worried or anxious way', example: 'He nervously clicked his pen during the test.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-009', word: 'Joyfully', definition: 'In a very happy way', example: 'The children joyfully ran outside to play.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-010', word: 'Patiently', definition: 'In a way that shows you can wait without getting upset', example: 'She patiently waited for her turn on the swing.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-011', word: 'Tremendously', definition: 'To a very great degree; extremely', example: 'The team improved tremendously after practice.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-012', word: 'Repeatedly', definition: 'Doing something over and over again', example: 'He repeatedly asked the same question.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-013', word: 'Bravely', definition: 'In a way that shows courage', example: 'The firefighter bravely entered the burning building.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-014', word: 'Warmly', definition: 'In a kind, friendly way', example: 'The teacher warmly welcomed the new student.', pos: 'adv', level: 'K-5' },
  { id: 'v-k5-d-015', word: 'Anxiously', definition: 'In a worried or uneasy way', example: 'She anxiously checked her test score.', pos: 'adv', level: 'K-5' },

  // 6-8 Nouns
  { id: 'v-68-n-001', word: 'Narrative', definition: 'A spoken or written account of connected events; a story', example: 'The narrative of the hero\'s journey captivated the audience.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-002', word: 'Hypothesis', definition: 'A proposed explanation that can be tested', example: 'The scientist formed a hypothesis about why the plant grew.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-003', word: 'Evidence', definition: 'Facts or signs that show something is true', example: 'The detective found evidence that proved the suspect was innocent.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-004', word: 'Metaphor', definition: 'A comparison between two unlike things without using like or as', example: 'The classroom was a zoo after the announcement.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-005', word: 'Perseverance', definition: 'Continuing to try even when things are difficult', example: 'Her perseverance helped her pass the difficult exam.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-006', word: 'Perspective', definition: 'A particular way of looking at or thinking about something', example: 'Reading the story from a different perspective changed my opinion.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-007', word: 'Consequence', definition: 'A result or effect of an action', example: 'Every choice has a consequence, good or bad.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-008', word: 'Innovation', definition: 'A new idea, method, or invention', example: 'The smartphone was a major innovation in communication.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-009', word: 'Obstacle', definition: 'Something that blocks or gets in the way', example: 'Lack of money was the biggest obstacle to the trip.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-010', word: 'Civilization', definition: 'An advanced state of human society with culture and government', example: 'Ancient civilizations built pyramids and temples.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-011', word: 'Specimen', definition: 'A sample or example of something for study', example: 'The scientist examined a specimen under the microscope.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-012', word: 'Heritage', definition: 'Cultural traditions passed down through generations', example: 'She is proud of her family\'s heritage and traditions.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-013', word: 'Democracy', definition: 'A system of government where people vote for their leaders', example: 'In a democracy, citizens have the power to choose their representatives.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-014', word: 'Ecosystem', definition: 'All the living and non-living things in an area that interact', example: 'The pond ecosystem includes fish, plants, and sunlight.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-015', word: 'Phenomenon', definition: 'An event or fact that can be observed and explained', example: 'The Northern Lights are a beautiful natural phenomenon.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-016', word: 'Abundance', definition: 'A very large amount of something', example: 'There was an abundance of food at the feast.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-017', word: 'Symptom', definition: 'A sign that shows an illness or problem exists', example: 'A cough and fever are common symptoms of a cold.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-018', word: 'Revenue', definition: 'Money that a business or government receives', example: 'The school raised revenue from the bake sale.', pos: 'noun', level: '6-8' },
  { id: 'v-68-n-019', word: 'Threshold', definition: 'The beginning point of something; a limit', example: 'She was on the threshold of a new career.', pos: 'noun', level: '6-8' },

  // 6-8 Verbs
  { id: 'v-68-v-001', word: 'Persuade', definition: 'To convince someone to do or believe something', example: 'She tried to persuade her friend to join the club.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-002', word: 'Analyze', definition: 'To examine something carefully to understand it', example: 'We will analyze the poem line by line.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-003', word: 'Illustrate', definition: 'To provide examples that make something clear', example: 'The teacher used a chart to illustrate the concept.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-004', word: 'Summarize', definition: 'To give a brief statement of the main points', example: 'Can you summarize the story in two sentences?', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-005', word: 'Evaluate', definition: 'To judge or figure out the value or quality of something', example: 'The teacher will evaluate your essay using a rubric.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-006', word: 'Interpret', definition: 'To explain the meaning of something', example: 'How do you interpret the ending of the novel?', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-007', word: 'Investigate', definition: 'To try to find out the facts about something', example: 'Detectives investigate crimes by gathering clues.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-008', word: 'Construct', definition: 'To build or create something by putting parts together', example: 'The students constructed a model of the solar system.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-009', word: 'Elaborate', definition: 'To add more detail or information to something', example: 'Can you elaborate on your answer?', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-010', word: 'Cite', definition: 'To mention something as proof or as a source', example: 'You must cite your sources in the bibliography.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-011', word: 'Formulate', definition: 'To create or develop a plan, idea, or statement carefully', example: 'The team formulated a strategy for the project.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-012', word: 'Generate', definition: 'To produce or create something', example: 'The experiment generated interesting results.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-013', word: 'Contrast', definition: 'To compare two things to show how they are different', example: 'The essay will contrast city life with country life.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-014', word: 'Emphasize', definition: 'To give special importance or attention to something', example: 'The principal emphasized the importance of attendance.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-015', word: 'Implement', definition: 'To put a plan or decision into effect', example: 'The school will implement a new reading program next year.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-016', word: 'Revise', definition: 'To look at something again and make changes to improve it', example: 'Please revise your essay before turning it in.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-017', word: 'Anticipate', definition: 'To expect or look forward to something', example: 'We anticipate a large crowd at the school fair.', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-018', word: 'Distinguish', definition: 'To tell the difference between two or more things', example: 'Can you distinguish between the two species of birds?', pos: 'verb', level: '6-8' },
  { id: 'v-68-v-019', word: 'Fluctuate', definition: 'To go up and down or change often', example: 'Temperatures can fluctuate a lot in spring.', pos: 'verb', level: '6-8' },

  // 6-8 Adjectives
  { id: 'v-68-a-001', word: 'Abundant', definition: 'Existing in large amounts; plentiful', example: 'The garden had an abundant supply of fresh vegetables.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-002', word: 'Meticulous', definition: 'Showing great attention to detail; very careful', example: 'The meticulous artist spent hours on each brushstroke.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-003', word: 'Reluctant', definition: 'Not willing to do something; hesitant', example: 'He was reluctant to give his presentation.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-004', word: 'Vivid', definition: 'Producing strong, clear images in the mind', example: 'The author used vivid descriptions to bring the scene to life.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-005', word: 'Significant', definition: 'Important or large enough to have an effect', example: 'The invention of the printing press was a significant event.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-006', word: 'Crucial', definition: 'Extremely important; necessary', example: 'Water is crucial for all living things.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-007', word: 'Prominent', definition: 'Important, well-known, or easy to see', example: 'She is a prominent leader in the community.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-008', word: 'Tentative', definition: 'Not certain or fixed; done without confidence', example: 'She gave a tentative answer and then checked her work.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-009', word: 'Rigorous', definition: 'Very thorough and careful; demanding', example: 'The training program was rigorous but rewarding.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-010', word: 'Coherent', definition: 'Clear, logical, and easy to follow', example: 'Her essay was well-organized and coherent.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-011', word: 'Concise', definition: 'Giving a lot of information in few words; brief and clear', example: 'The teacher asked for a concise summary.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-012', word: 'Notorious', definition: 'Famous for something bad', example: 'The pirate was notorious for stealing treasure.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-013', word: 'Profound', definition: 'Very great or strong; showing deep understanding', example: 'The book had a profound impact on how I see the world.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-014', word: 'Preliminary', definition: 'Happening before something more important; early', example: 'The preliminary results look promising.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-015', word: 'Inevitable', definition: 'Certain to happen; unavoidable', example: 'Change is inevitable in a growing city.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-016', word: 'Ambiguous', definition: 'Having more than one possible meaning; unclear', example: 'The ending of the story was ambiguous and open to interpretation.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-017', word: 'Nuanced', definition: 'Having small but important differences', example: 'Her understanding of the topic was very nuanced.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-018', word: 'Tangible', definition: 'Real and able to be touched or seen', example: 'The project had tangible results we could measure.', pos: 'adj', level: '6-8' },
  { id: 'v-68-a-019', word: 'Compassionate', definition: 'Feeling or showing care and concern for others', example: 'The compassionate nurse helped calm the scared patient.', pos: 'adj', level: '6-8' },

  // 6-8 Adverbs
  { id: 'v-68-d-001', word: 'Deliberately', definition: 'In a way that is intentional, not accidental', example: 'She deliberately ignored the alarm and went back to sleep.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-002', word: 'Frequently', definition: 'Often; happening many times', example: 'He frequently visits the library after school.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-003', word: 'Thoroughly', definition: 'In a complete and careful way', example: 'She thoroughly reviewed her notes before the exam.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-004', word: 'Simultaneously', definition: 'At the same time', example: 'The two events happened simultaneously.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-005', word: 'Consequently', definition: 'As a result; therefore', example: 'He did not study, and consequently he failed the test.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-006', word: 'Reluctantly', definition: 'In an unwilling or hesitant way', example: 'She reluctantly agreed to share her notes.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-007', word: 'Inevitably', definition: 'In a way that cannot be avoided', example: 'The team inevitably made some mistakes in the first game.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-008', word: 'Precisely', definition: 'In an exact and accurate way', example: 'The scientist precisely measured the chemicals.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-009', word: 'Gradually', definition: 'Happening slowly over time', example: 'She gradually improved her grades throughout the semester.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-010', word: 'Explicitly', definition: 'In a clear and direct way', example: 'The instructions explicitly stated not to open the box.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-011', word: 'Predominantly', definition: 'Mostly; for the most part', example: 'The audience was predominantly students.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-012', word: 'Consistently', definition: 'In a way that stays the same over time', example: 'She consistently turned in her homework on time.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-013', word: 'Merely', definition: 'Only; and nothing more', example: 'He was merely trying to help.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-014', word: 'Subsequently', definition: 'Afterward; following something else', example: 'She lost her wallet and subsequently could not pay for lunch.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-015', word: 'Strikingly', definition: 'In a very noticeable or impressive way', example: 'The two paintings were strikingly different.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-016', word: 'Ironically', definition: 'In a way that is opposite to what is expected', example: 'Ironically, the fire station burned down.', pos: 'adv', level: '6-8' },
  { id: 'v-68-d-017', word: 'Accurately', definition: 'In a correct and exact way', example: 'She accurately described what happened during the experiment.', pos: 'adv', level: '6-8' },

  // 9-12 Nouns
  { id: 'v-912-n-001', word: 'Allegory', definition: 'A story with a hidden meaning, often moral or political', example: 'Animal Farm is an allegory about the Russian Revolution.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-002', word: 'Catalyst', definition: 'Something that causes a major change or action', example: 'The protest was a catalyst for new legislation.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-003', word: 'Dichotomy', definition: 'A division into two very different or opposite things', example: 'There is a dichotomy between rich and poor in the city.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-004', word: 'Juxtaposition', definition: 'Placing two things side by side to highlight contrast', example: 'The juxtaposition of wealth and poverty was striking.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-005', word: 'Paradigm', definition: 'A typical example or pattern of something; a model', example: 'The discovery created a new paradigm in physics.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-006', word: 'Anomaly', definition: 'Something that is different from what is normal or expected', example: 'The scientist noticed an anomaly in the data.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-007', word: 'Rhetoric', definition: 'The art of speaking or writing to persuade or influence', example: 'The politician used powerful rhetoric in her speech.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-008', word: 'Prerogative', definition: 'A right or privilege that belongs to a particular person or group', example: 'It is the teacher\'s prerogative to set classroom rules.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-009', word: 'Tenet', definition: 'A principle or belief that is held to be true', example: 'Freedom of speech is a core tenet of democracy.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-010', word: 'Proliferation', definition: 'A rapid increase in the number or amount of something', example: 'The proliferation of social media has changed communication.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-011', word: 'Ambiguity', definition: 'The quality of having more than one possible meaning', example: 'The ambiguity of the poem allows for many interpretations.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-012', word: 'Sovereignty', definition: 'The power of a country to govern itself', example: 'The nation fought to protect its sovereignty.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-013', word: 'Ideology', definition: 'A set of ideas or beliefs, especially in politics or economics', example: 'The two parties had very different ideologies.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-014', word: 'Hegemony', definition: 'Leadership or dominance by one country or group over others', example: 'The empire established hegemony over the entire region.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-015', word: 'Ostentation', definition: 'A showy display meant to impress others', example: 'The ostentation of the royal palace amazed visitors.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-016', word: 'Quintessence', definition: 'The most perfect or typical example of something', example: 'She is the quintessence of a dedicated student.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-017', word: 'Dissonance', definition: 'A lack of agreement or harmony between things', example: 'There was cognitive dissonance between his words and actions.', pos: 'noun', level: '9-12' },
  { id: 'v-912-n-018', word: 'Equilibrium', definition: 'A state of balance between opposing forces', example: 'The ecosystem reached a new equilibrium after the fire.', pos: 'noun', level: '9-12' },

  // 9-12 Verbs
  { id: 'v-912-v-001', word: 'Hypothesize', definition: 'To propose an explanation that can be tested', example: 'Scientists hypothesize that the disease spreads through water.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-002', word: 'Extrapolate', definition: 'To extend known information to make a guess about the unknown', example: 'We can extrapolate from the data to predict next year\'s results.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-003', word: 'Advocate', definition: 'To publicly support or recommend a particular cause', example: 'She advocates for better school funding.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-004', word: 'Juxtapose', definition: 'To place two things side by side for comparison', example: 'The artist juxtaposed light and dark colors in the painting.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-005', word: 'Mitigate', definition: 'To make something less severe, harmful, or painful', example: 'We planted trees to mitigate the effects of pollution.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-006', word: 'Substantiate', definition: 'To provide evidence to prove that something is true', example: 'You need data to substantiate your claims.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-007', word: 'Scrutinize', definition: 'To examine something very carefully and closely', example: 'The lawyer scrutinized every detail of the contract.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-008', word: 'Obfuscate', definition: 'To make something unclear or hard to understand', example: 'The lawyer tried to obfuscate the facts of the case.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-009', word: 'Amalgamate', definition: 'To combine or unite to form one organization or group', example: 'The two schools amalgamated to form a larger district.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-010', word: 'Galvanize', definition: 'To shock or excite someone into taking action', example: 'The speech galvanized the crowd into protesting.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-011', word: 'Reconcile', definition: 'To bring two ideas or groups into agreement', example: 'She tried to reconcile her love of art with her need for a stable job.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-012', word: 'Exacerbate', definition: 'To make a problem or bad situation worse', example: 'The drought exacerbated the food shortage.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-013', word: 'Synthesize', definition: 'To combine different ideas or parts into a whole', example: 'Students must synthesize information from multiple sources.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-014', word: 'Ostracize', definition: 'To exclude someone from a group or society', example: 'He was ostracized by his peers for speaking out.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-015', word: 'Delineate', definition: 'To describe or mark the exact limits of something', example: 'The report delineates the boundaries of the study area.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-016', word: 'Dissipate', definition: 'To scatter or fade away gradually', example: 'The fog began to dissipate as the sun rose.', pos: 'verb', level: '9-12' },
  { id: 'v-912-v-017', word: 'Circumvent', definition: 'To find a way around an obstacle or rule', example: 'The students tried to circumvent the school firewall.', pos: 'verb', level: '9-12' },

  // 9-12 Adjectives
  { id: 'v-912-a-001', word: 'Ephemeral', definition: 'Lasting for a very short time', example: 'The ephemeral beauty of the sunset lasted only minutes.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-002', word: 'Pragmatic', definition: 'Dealing with things in a practical, realistic way', example: 'She took a pragmatic approach to solving the budget problem.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-003', word: 'Ubiquitous', definition: 'Found everywhere; very common', example: 'Smartphones have become ubiquitous in modern society.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-004', word: 'Pernicious', definition: 'Having a harmful effect, especially in a gradual way', example: 'The pernicious influence of misinformation can erode trust.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-005', word: 'Clandestine', definition: 'Done in secret, often because it is illegal or dishonest', example: 'The rebels held a clandestine meeting at midnight.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-006', word: 'Audacious', definition: 'Showing a willingness to take bold risks', example: 'The audacious plan to climb the mountain surprised everyone.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-007', word: 'Spurious', definition: 'False or fake; not genuine', example: 'The study was based on spurious data.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-008', word: 'Superfluous', definition: 'More than what is needed; unnecessary', example: 'Remove any superfluous words from your essay.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-009', word: 'Ostensible', definition: 'Appearing to be true or real but not necessarily so', example: 'The ostensible reason for the meeting was to discuss the budget.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-010', word: 'Sycophantic', definition: 'Acting overly obedient or flattering to gain an advantage', example: 'The sycophantic aide always agreed with the boss.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-011', word: 'Ineffable', definition: 'Too great or extreme to be expressed in words', example: 'The view from the mountaintop was ineffable.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-012', word: 'Capricious', definition: 'Changing suddenly and without a clear reason', example: 'The capricious weather made it hard to plan the picnic.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-013', word: 'Munificent', definition: 'Very generous or giving', example: 'The munificent donor funded the entire scholarship program.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-014', word: 'Vindictive', definition: 'Wanting to hurt someone who has hurt you', example: 'The vindictive politician sought revenge on his rivals.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-015', word: 'Didactic', definition: 'Intended to teach or instruct, sometimes in a moralizing way', example: 'The novel had a didactic tone that some readers found preachy.', pos: 'adj', level: '9-12' },
  { id: 'v-912-a-016', word: 'Esoteric', definition: 'Understood by only a small group with special knowledge', example: 'The professor\'s lecture on quantum mechanics was too esoteric for freshmen.', pos: 'adj', level: '9-12' },

  // 9-12 Adverbs
  { id: 'v-912-d-001', word: 'Inadvertently', definition: 'Without meaning to; by accident', example: 'She inadvertently revealed the surprise party.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-002', word: 'Simultaneously', definition: 'At the same time', example: 'Both teams scored simultaneously, creating a tie.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-003', word: 'Inconspicuously', definition: 'In a way that does not attract attention', example: 'He inconspicuously slipped out the back door.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-004', word: 'Apathetically', definition: 'In a way that shows no interest or concern', example: 'She apathetically shrugged when asked about the election.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-005', word: 'Paradoxically', definition: 'In a way that seems to contradict itself but may be true', example: 'Paradoxically, the more he studied, the less confident he felt.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-006', word: 'Surreptitiously', definition: 'In a secret or stealthy way', example: 'She surreptitiously glanced at the answer key.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-007', word: 'Inextricably', definition: 'In a way that cannot be separated or untangled', example: 'The two issues are inextricably linked.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-008', word: 'Perfunctorily', definition: 'In a way that shows little interest or effort', example: 'He perfunctorily completed the assignment just to get it done.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-009', word: 'Conspicuously', definition: 'In a very noticeable or obvious way', example: 'She was conspicuously absent from the meeting.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-010', word: 'Pragmatically', definition: 'In a practical and realistic way', example: 'We must pragmatically address the budget shortfall.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-011', word: 'Prolifically', definition: 'In a way that produces a great amount of something', example: 'The author prolifically wrote novels throughout her career.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-012', word: 'Unilaterally', definition: 'By one side or party only, without others agreeing', example: 'The country unilaterally withdrew from the treaty.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-013', word: 'Maliciously', definition: 'In a way that is intended to harm or upset someone', example: 'The rumor was maliciously spread to damage his reputation.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-014', word: 'Empirically', definition: 'Based on observation or experience rather than theory', example: 'The theory has not been empirically tested.', pos: 'adv', level: '9-12' },
  { id: 'v-912-d-015', word: 'Indiscriminately', definition: 'Without making careful choices; randomly', example: 'He indiscriminately threw his clothes into the closet.', pos: 'adv', level: '9-12' },
]

// ============================================================
// Helper Functions
// ============================================================

export function getCardsByFilter(filter: {
  pos?: PosTag[]
  level?: CardLevel | 'all'
}): VocabCard[] {
  let result = VOCAB_CARDS
  if (filter.pos && filter.pos.length > 0) {
    result = result.filter(c => filter.pos!.includes(c.pos))
  }
  if (filter.level && filter.level !== 'all') {
    result = result.filter(c => c.level === filter.level)
  }
  return result
}

export function shuffleCards(cards: VocabCard[]): VocabCard[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
