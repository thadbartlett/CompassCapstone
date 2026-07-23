// quiz.config.js
//
// Multiple-choice quiz content, keyed by hotspot id. Each quiz has an intro and
// a list of questions. A question has an id (used for xAPI activity ids), a
// prompt, options (key + text), the correct key, and the correct-answer
// feedback (HTML) shown once the learner answers correctly.
//
// Flow (see quiz.js): intro -> each question in turn. A wrong answer prompts a
// retry until correct; a correct answer reveals the feedback and a Next button.
// After the last question, the hotspot is marked complete.

export const QUIZZES = {
  rules: {
    intro: `
      <p>Most of the information in this section can be found in the
      <strong>Compass Handbook</strong>. This short activity highlights a few of
      the most important policies for Capstone students.</p>
      <p>Answer each multiple-choice question below. If you miss one, you'll get
      a chance to try again. Work through all the questions to complete this
      section.</p>
    `,
    questions: [
      {
        id: "phones",
        prompt: "What is the Capstone phone policy during the community day?",
        options: [
          { key: "A", text: "Students may use phones during lunch as long as they remain in the lunchroom." },
          { key: "B", text: "Students may keep phones in their backpacks but should not use them during class." },
          { key: "C", text: "Only seniors may keep their phones because they have additional privileges." },
          { key: "D", text: "Phones are collected by the tutor at the beginning of the day and returned at the end of the day." },
        ],
        correct: "D",
        feedback: `
          <p>Capstone students may not use phones during the community day,
          including lunch. Phones will be collected by the tutor at the start of
          the day. It is each student's responsibility to retrieve their phone at
          the end of the day.</p>
          <p>We ask parents to help us reinforce this expectation because it helps
          create a focused, distraction-free learning environment where students
          can fully engage with their peers, tutors, and coursework.</p>
        `,
      },
      {
        id: "accountability",
        prompt: "Why might a Capstone tutor contact a parent about unfinished work?",
        options: [
          { key: "A", text: "To issue an immediate penalty for every incomplete assignment" },
          { key: "B", text: "To determine whether the student should be removed from a strand" },
          { key: "C", text: "To check that everything is okay and see whether the family needs support" },
          { key: "D", text: "To transfer responsibility for checking assignments from the parent to the tutor" },
        ],
        correct: "C",
        feedback: `
          <p>One of the benefits of Capstone is accountability. If a student
          regularly arrives without completed work, the tutor may reach out to the
          parent to check in.</p>
          <p>This year, our guides include a parent–tutor communication page. Both
          the parent and tutor have a place to mark work as complete and leave
          notes for one another. Over time, this helps everyone recognize
          patterns, including areas where a student may need extra help or where
          work is consistently going unfinished.</p>
          <p>Please know that this communication is not criticism or fussing. We
          simply want to make sure all is well and determine whether a student or
          family could use additional support.</p>
          <p>When each family signs its application, you commit to participating in
          every strand. That commitment gives our community and program strength.
          It does not mean that no one will ever have an off week. It means that we
          are here to help each family be as successful as possible.</p>
          <p>Accountability is one of the gifts of community. We want to come
          alongside parents as teammates, not critics.</p>
        `,
      },
      {
        id: "rule-of-three",
        prompt: "Which situation best reflects a correct understanding of Compass's Rule of Three?",
        options: [
          { key: "A", text: "A tutor meets one-on-one with a student in a classroom but leaves the door open" },
          { key: "B", text: "Two students stay behind together after class to finish an assignment" },
          { key: "C", text: "A tutor works with one student while another student is present in the room" },
          { key: "D", text: "A student meets privately with a tutor as long as it is during school hours" },
        ],
        correct: "C",
        feedback: `
          <p>The Rule of Three still applies to Capstone students.</p>
          <p>A student should not be alone with only one adult or alone with only
          one other student. There should always be at least three people
          present.</p>
          <p>This policy helps protect both students and adults and keeps our
          community safe. Parents and students should remain aware of this
          expectation throughout the entire community day, including arrival,
          lunch, class transitions, and dismissal.</p>
        `,
      },
      {
        id: "senior-privileges",
        prompt: "Which privilege is reserved exclusively for Compass seniors?",
        options: [
          { key: "A", text: "Leaving campus during lunch" },
          { key: "B", text: "Using the coffee room" },
          { key: "C", text: "Rule of three does not apply for students" },
          { key: "D", text: "Later start time for community days" },
        ],
        correct: "B",
        feedback: `
          <p>Seniors receive several special privileges and opportunities
          throughout the year, including:</p>
          <ul>
            <li>Reserved senior parking spaces</li>
            <li>Access to the coffee room</li>
            <li>Senior breakfasts</li>
            <li>Graduation activities and celebrations</li>
          </ul>
          <p>Seniors are the only students permitted in the coffee room.</p>
          <p>These privileges help make senior year special, but seniors are still
          expected to follow Compass policies, including the phone policy, the Rule
          of Three, and participation in every strand.</p>
        `,
      },
      {
        id: "graduation",
        prompt: "What is the best way senior families can help graduation planning remain organized?",
        options: [
          { key: "A", text: "Wait until spring to complete all graduation decisions at once" },
          { key: "B", text: "Purchase graduation items independently before information is released" },
          { key: "C", text: "Keep the deadlines provided in the graduation packet" },
          { key: "D", text: "Contact the graduation organizers weekly for updated instructions" },
        ],
        correct: "C",
        feedback: `
          <p>More graduation information will be shared next month.</p>
          <p>Caps and gowns will likely be ordered in January so seniors can have
          them in time for senior pictures. An $80 graduation fee will be collected
          at that time to cover the cap and gown.</p>
          <p>Graduation stoles may be borrowed from Compass. Families who would
          like to keep a stole may purchase one for an additional $40.</p>
          <p>We will gather information and complete graduation tasks throughout
          the year rather than waiting until the final weeks. Senior year can be
          exciting, emotional, and exhausting for families. Our goal is to make the
          process as organized as possible so parents and students can enjoy this
          special season.</p>
          <p>Families can help by keeping the deadlines listed in the graduation
          packet. Meeting those deadlines helps keep the process organized and
          manageable for both families and the graduation organizers.</p>
        `,
      },
      {
        id: "student-drivers",
        prompt: "What must a Capstone student do before driving to Compass?",
        options: [
          { key: "A", text: "Bring their tutor a specialty coffee of their choice for three weeks straight" },
          { key: "B", text: "Receive verbal permission from a tutor each week" },
          { key: "C", text: "Have a driver permission form on file with the directors" },
          { key: "D", text: "Understand where designated parking spaces are for students" },
        ],
        correct: "C",
        feedback: `
          <p>Before a student may drive to Compass, a completed driver permission
          form must be on file with the directors.</p>
          <p>Driving to Compass is a privilege and comes with the responsibility to
          drive safely and carefully while on church property. If a student drives
          recklessly or fails to follow campus driving expectations, that privilege
          may be revoked.</p>
          <p>Parents should make sure the required form has been submitted before
          allowing their student to drive to the community day.</p>
        `,
      },
    ],
  },
};
