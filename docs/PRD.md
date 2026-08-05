# Product Requirements



I scrapped data from a website and I want an app which locally runs and keeps my progress and option to mark as completed or not completed



This data has two things, one is cheatsheets and another is categories



DATA/cheatsheets.json sample

{

  "data": [

    {

      "id": "big-o-notation",

      "title": "Big O Notation",

      "description": "Time and space complexity analysis with code examples",

      "filename": "big-o-notation.md",

      "free": true,

      "category": "Fundamentals",

      "order": 1

    },

    {

      "id": "recursion-guide",

      "title": "Recursion Guide",

      "description": "Understanding recursion and recursive problem solving",

      "filename": "recursion-guide.md",

      "free": true,

      "category": "Fundamentals",

      "order": 2

    },

    {

      "id": "nested-loop-complexity",

      "title": "Nested Loop Complexity",

...

for each of these items in this we have DATA/Cheatsheets/{item.id}.json and one sample is

DATA/Cheatsheets/big-o-notation.json

{

  "data": {

    "content": "# Big O Notation - Co.......................s, not its absolute speed.\n- Just because an algorithm is O(1) does not mean that it is automatically fast.\n", 

    "config": {

      "id": "big-o-notation",

      "title": "Big O Notation",

      "description": "Time and space complexity analysis with code examples",

      "filename": "big-o-notation.md",

      "free": true,

      "category": "Fundamentals",

      "order": 1

    }

  }

}

so each cheatsheet json is having markdown content which needs to be diplayed for that specific topic



DATA/categories.json sample

{

  "categories": [

    {

      "title": "Data Structures & Algorithms",

      "description": "Follow a structured path to learn all of the core data structures & algorithms. Perfect for coding interview preparation.",

      "courses": [

        {

                        

            "id": "dsa-for-beginners",

            "link": "/courses/dsa-for-beginners",

            "title": "Algorithms & Data Structures for Beginners",

            "description": "Learn the foundations of coding interviews.",

            "image": "https://imagedelivery.net/CLfkmk9Wzy8_9HRyug4EVA/a65736b6-151f-4572-8e10-87b2b75ab100/public",

            "duration": "35 hours",

            "difficulty": "Medium",

            "jsonPath": "Data Structures & Algorithms/Algorithms & Data Structures for Beginners/dsa-for-beginners.json",

            "completed": 0,

            "total": 35

        },

        {

            "id": "advanced-algorithms",

            "link": "/courses/advanced-algorithms",

            "title": "Advanced Algorithms",

            "description": "Learn every algorithm you would ever need.",

            "image": "https://imagedelivery.net/CLfkmk9Wzy8_9HRyug4EVA/dd1abac9-220d-4c4d-a8c5-d755e2606800/public",

            "duration": "25 hours",

            "difficulty": "Hard",

            "jsonPath": "Data Structures & Algorithms/Advanced Algorithms/advanced-algorithms.json",

            "completed": 0,

            "total": 22

        }

      ]

    },

    {

      "title": "Object Oriented Design",

      "description": "Dive deeper into object-oriented programming by focusing on design patterns and principles.",

      "courses": [

        {

            "id": "ood-interview",

            "link": "/courses/ood-interview",

            "title": "Object Oriented Design Interviews",



There are 5 categories and every category has a folder in DATA folder

DATA/{category title}/{course title}/{course id}.json

One course sample is 

{

  "data": {

    "name": "Algorithms and Data Structures for Beginners",

    "baseCodeUrl": "https://raw.githubusercontent.com/neetcode-gh/course-data/main/dsa-for-beginners/code/",

    "sections": [

      {

        "name": "About",

        "lessons": [

          {

            "name": "Introduction",

            "vimeo": "741856436?h=5426746fca",

            "free": true,

            "length": 1

          }

        ]

      },

      {

        "name": "Arrays",

        "lessons": [

          {

            "name": "RAM",

            "vimeo": "750221615?h=694c0b1061",

            "free": true,

            "length": 6

          },

          {

            "name": "Static Arrays",

            "vimeo": "",

            "suggestedProblems": [

              "max-consecutive-ones/",

              "remove-element/",

              "replace-elements-with-greatest-element-on-right-side/"

            ],

            "length": 15

          },

          {

            "name": "Dynamic Arrays",

            "vimeo": "",

            "suggestedProblems": [

              "concatenation-of-array/"

            ],

            "customProblem": "dynamicArray",

...



Every section has a folder in course folder, every section has lessons folders and every lesson has its own folders and inside those lessons folder we have that particular lessons' contents

DATA/{category title}/{course title}/{section name}/{lesson name}

contents are:

1. _lesson.json sample

{

  "courseId": "dsa-for-beginners",

  "sectionName": "Arrays",

  "lessonName": "Dynamic Arrays",

  "folderName": "Dynamic Arrays",

  "problemId": null,

  "api": {

    "path": "/api/articleFunctionHttp",

    "courseId": "dsa-for-beginners",

    "lessonId": "Dynamic Arrays"

  }

}

2. article.json (has the lesson markdown text data which we render and show the essense of lesson)

{"data": "# Dynamic Arrays\n Dynamic arrays are a ....."}



3. code.json (has the code blocks of different languages for that lesson)
{"data": {"cpp": "cpp code...", "python": "python code...", "go": "...", "javascript": "..."....}

4. {Lesson name}.mkv (video content of that lesson)

For all markdown I have a html page which can render all content like in cheatsheets lessons and code

I want to an app to see these content structured with progress tracking

What is best way to create an app for this requirement?