const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'blog.db');
const db = new DatabaseSync(dbPath);

const blogs = [
  {
    title: "Bolt-On Security the Linux Way",
    body: "Securing a Linux system doesn't have to be an afterthought. By implementing basic bolt-on security measures like configuring UFW (Uncomplicated Firewall), setting strict SSH key authentication, and using tools like Fail2Ban, you can drastically reduce your server's attack surface. It's not just about locking everything down; it's about creating a layered defense strategy where each component covers the blind spots of the others. Regular updates and minimizing installed packages are your first line of defense.",
    author: "Tasfia",
    blogImage: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=1000",
    category: "technology"
  },
  {
    title: "Japanese Food: A Culinary Travel Guide",
    body: "Exploring Japan through its cuisine is an adventure of a lifetime. From the bustling street food stalls of Osaka serving piping hot takoyaki to the quiet, centuries-old sushi counters in Tokyo, every meal tells a story of tradition and precision. Ramen, perhaps the most famous export, varies wildly by region—whether it's the rich, creamy tonkotsu of Fukuoka or the clear, soy-based broths of Kanto. Understanding the local food culture is the best way to connect with the heart of Japan.",
    author: "Mansura",
    blogImage: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&q=80&w=1000",
    category: "travel"
  },
  {
    title: "Michael Laudrup - The best of a generation",
    body: "Michael Laudrup remains one of the most elegant playmakers in football history. Watching him glide past defenders with his signature 'croqueta' was pure poetry in motion. During his time at Barcelona and later Real Madrid, he didn't just play the game; he orchestrated it with a vision that few could match. While statistics and goal tallies dominate today's football discussions, Laudrup reminds us that the game is fundamentally an art form, built on intelligence, timing, and flawless technique.",
    author: "Nubayra",
    blogImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000",
    category: "sports"
  },
  {
    title: "The Best Plant-Based Foods To Build Collagen Naturally",
    body: "You don't need animal products to maintain glowing skin and healthy joints. Your body naturally synthesizes collagen when provided with the right building blocks, primarily Vitamin C, zinc, and copper. Citrus fruits, strawberries, and bell peppers are massive boosters for collagen production. Additionally, adding pumpkin seeds, cashews, and garlic to your daily diet provides the essential minerals your skin needs to maintain its elasticity and youthful bounce without relying on supplements.",
    author: "Nubayra",
    blogImage: "https://images.unsplash.com/photo-1512621843614-b3e189974fa4?auto=format&fit=crop&q=80&w=1000",
    category: "beauty"
  },
  {
    title: "Exfoliate + Moisturize With These Homemade Scrub Bars",
    body: "Taking care of your skin doesn't require expensive spa treatments or chemical-heavy products. These DIY homemade scrub bars combine the rough exfoliating texture of raw organic sugar with the deeply hydrating properties of shea butter and coconut oil. Simply melt the butters, mix in the sugar and a few drops of lavender essential oil, and freeze them in silicone molds. They are perfect for your morning shower, gently removing dead skin cells while leaving a protective moisture barrier behind.",
    author: "Nubayra",
    blogImage: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=1000",
    category: "beauty"
  },
  {
    title: "6 Effective Digital Marketing Strategies for Startup in 2021",
    body: "Startups face fierce competition, making a solid digital marketing strategy absolutely crucial for survival. Instead of burning budget on broad, untargeted ads, successful founders are focusing on hyper-niche content marketing and community building. Leveraging SEO for long-term organic traffic, while using micro-influencer partnerships on platforms like TikTok and Instagram, yields a much higher ROI. Furthermore, building a robust email list from day one ensures you own your audience, protecting your brand from unpredictable algorithm changes.",
    author: "Tasfia",
    blogImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
    category: "technology"
  },
  {
    title: "Behind the Scenes of a Cyber Attack Simulation",
    body: "Running a simulated cyber attack, or a 'Red Team engagement', is the ultimate stress test for any corporate network. It involves ethical hackers using real-world malware tactics, phishing campaigns, and social engineering to bypass a company's defenses. The goal isn't to cause damage, but to find vulnerabilities before actual malicious actors do. The post-simulation debrief usually reveals that human error—like clicking a spoofed email link—remains the biggest threat, regardless of how advanced the company's firewalls are.",
    author: "Tasfia",
    blogImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000",
    category: "technology"
  },
  {
    title: "48 Hours in Kyoto: Temples, Tea and Tiny Streets",
    body: "Kyoto is a city where ancient traditions seamlessly blend with modern life. If you only have 48 hours, start early at the Fushimi Inari Bamboo Forest to beat the crowds, then head to the historic Gion district in hopes of spotting a Geisha. Dedicate your afternoon to sipping authentic matcha in a traditional tea house overlooking a Zen rock garden. It's a place that forces you to slow down, breathe, and appreciate the meticulously preserved architecture of Japan's former imperial capital.",
    author: "Mansura",
    blogImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000",
    category: "travel"
  },
  {
    title: "From Sunday League to Champions League: A Striker's Journey",
    body: "The path from grassroots football to the elite level is rarely a straight line. It is paved with early morning training sessions in freezing rain, countless rejections from academy scouts, and injuries that test mental resilience. For a young striker, the transition means adapting to a game where defenders are faster and tactical systems are infinitely more complex. But the ones who make it to the Champions League share one trait: an obsessive, almost unreasonable drive to improve their finishing every single day.",
    author: "Nubayra",
    blogImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1000",
    category: "sports"
  },
  {
    title: "Night Skincare Routine for Tired Screens-and-Coffee People",
    body: "Long hours in front of monitors and endless cups of coffee leave our skin dehydrated, dull, and prone to premature aging from blue light exposure. A restorative night routine is your best weapon against developer fatigue. Start with a double cleanse to melt away the day's oil, follow up with a hyaluronic acid serum on damp skin to lock in moisture, and finish with a rich ceramide cream. Skip the harsh acids when you're stressed; focus purely on barrier repair and hydration.",
    author: "Nubayra",
    blogImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=1000",
    category: "beauty"
  },
  {
    title: "5 Command Line Habits That Make You a Faster Developer",
    body: "Mastering the command line is a superpower for any developer. Stop using your mouse to navigate directories and start utilizing tools like 'z' or 'fzf' for instant jumping. Creating custom Bash or Zsh aliases for your most typed Git commands can save you hours every month. Furthermore, learning basic grep and awk commands allows you to parse massive log files in seconds instead of scrolling through them in a text editor. Terminal proficiency is the quiet marker of a seasoned engineer.",
    author: "Tasfia",
    blogImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000",
    category: "technology"
  },
  {
    title: "Remote Work City Guide: Lisbon for Digital Nomads",
    body: "Lisbon has quickly become Europe's premier hub for remote workers, and it's easy to see why. The city offers over 300 days of sunshine a year, lightning-fast fiber internet, and a vibrant international community. Neighborhoods like Alfama and Bairro Alto are packed with laptop-friendly cafes serving incredible pastéis de nata and strong espresso. While the cost of living has risen recently, it remains highly affordable compared to London or Paris, making it the perfect base for tech workers seeking work-life balance.",
    author: "Mansura",
    blogImage: "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&q=80&w=1000",
    category: "travel"
  }
];

db.exec('BEGIN');
try {
  // Clear existing data
  db.exec('DELETE FROM blogs; DELETE FROM categories;');

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const insertBlog = db.prepare(`
    INSERT INTO blogs (title, body, author, blog_image, category_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const getCatId = db.prepare('SELECT id FROM categories WHERE name = ?');

  for (const blog of blogs) {
    insertCat.run(blog.category);
    const { id: catId } = getCatId.get(blog.category);
    insertBlog.run(blog.title, blog.body, blog.author, blog.blogImage, catId);
  }

  db.exec('COMMIT');
  console.log(`✅ ${blogs.length} blog betöltve az adatbázisba!`);
} catch (err) {
  db.exec('ROLLBACK');
  console.error('❌ Hiba:', err.message);
  process.exit(1);
}
