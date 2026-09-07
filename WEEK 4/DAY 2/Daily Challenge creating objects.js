// 1. Define the Video class
class Video {
  constructor(title, uploader, time) {
    this.title = title;
    this.uploader = uploader;
    this.time = time;
  }

  // 2. Define the watch method
  watch() {
    console.log(`${this.uploader} watched all ${this.time}s of ${this.title}!`);
  }
}

// 3. Instantiate a new Video instance and call watch()
const video1 = new Video('JavaScript Basics', 'John Doe', 300);
video1.watch(); 
// Output: John Doe watched all 300s of JavaScript Basics!

// 4. Instantiate a second Video instance
const video2 = new Video('Advanced Object Methods', 'Jane Smith', 600);
video2.watch(); 
// Output: Jane Smith watched all 600s of Advanced Object Methods!

// 5. Bonus: Store data for 5 videos using an array of objects
const videosData = [
  { title: 'CSS Grid Tutorial', uploader: 'Alex', time: 450 },
  { title: 'React Crash Course', uploader: 'Sarah', time: 1200 },
  { title: 'Node.js Express Intro', uploader: 'Mike', time: 900 },
  { title: 'Python OOP Overview', uploader: 'Emily', time: 750 },
  { title: 'Git & GitHub Basics', uploader: 'David', time: 360 }
];

// 6. Bonus: Loop through the array to instantiate and call watch()
const videoInstances = videosData.map(data => new Video(data.title, data.uploader, data.time));

videoInstances.forEach(video => video.watch());