// linear.config.js
//
// Content for the multi-screen "linear" learning interaction, keyed by hotspot
// id. Each screen has a `kind` that determines how linear.js renders it:
//   choice   - single-select prompt (unscored; the pick is recorded), then a
//              follow-up message. Continue after a selection.
//   cards    - reveal cards that all must be opened, then a summary. Continue
//              after all are opened.
//   question - one scored multiple-choice question. Wrong -> incorrectFeedback
//              + retry; correct -> correctFeedback. Continue after correct.
//   reveal   - a single click-to-reveal panel. Continue after it's opened.
//
// `icon` values map to inline SVGs defined in linear.js.

export const LINEAR = {
  welcome: {
    screens: [
      // ---- SCREEN 1: WELCOME ----------------------------------------
      {
        kind: "choice",
        icon: "compass",
        heading: "What Is Classical Education?",
        intro: `
          <p>If you are new to our community, you may have arrived for many
          different reasons.</p>
          <p>Perhaps you visited and saw something you felt good about joining.
          Perhaps you noticed the way our families interact and build one another
          up. You may have already been looking for classical education, or perhaps
          you simply needed guidance and were not sure where else to turn. Maybe
          you saw the fruit in another family and wanted something similar for your
          own.</p>
          <p>Whatever brought you here, we are so glad you are part of Compass.</p>`,
        prompt: "What first drew your family to Compass?",
        activityId: "what-drew-you",
        options: [
          "Christian community",
          "Classical education",
          "Guidance for homeschooling",
          "The fruit we saw in another family",
          "Compass simply felt like the right fit",
        ],
        afterMessage: `Whatever path brought you here, you are welcome. Together,
          we are learning to navigate the homeschooling journey with God as our
          guide.`,
      },

      // ---- SCREEN 2: THE THREE STAGES -------------------------------
      {
        kind: "cards",
        icon: "layers",
        heading: "Children Grow Through Three Stages of Learning",
        intro: `
          <p>Classical education is an old approach to learning, truly one of the
          oldest. For centuries, this was simply how education was done.</p>
          <p>It recognizes that children naturally grow through three broad stages
          of learning: grammar, logic, and rhetoric.</p>`,
        cards: [
          {
            icon: "book",
            title: "Grammar",
            body: `In the early years, students gather facts, language, and
              foundational knowledge. They absorb information readily and begin
              building the knowledge they will use later.`,
          },
          {
            icon: "branch",
            title: "Logic",
            body: `As students grow, they begin asking why. They learn to reason,
              examine ideas, recognize relationships, and think carefully about
              what they know.`,
          },
          {
            icon: "chat",
            title: "Rhetoric",
            body: `In the later years, students learn to express what they know
              with clarity, persuasion, and beauty. They practice communicating
              ideas thoughtfully and effectively.`,
          },
        ],
        summary: `Classical education moves from gathering knowledge, to
          understanding and evaluating it, to communicating it well.`,
      },

      // ---- SCREEN 3: THE IMPORTANCE OF READING (scored) -------------
      {
        kind: "question",
        icon: "book",
        heading: "The Importance of Reading in Classical Education",
        id: "reading",
        prompt: "Why does classical education place such a strong emphasis on reading?",
        options: [
          { key: "A", text: "Longer assignments automatically make a course more rigorous." },
          { key: "B", text: "Students need to complete as many books as possible." },
          { key: "C", text: "Great books and primary sources shape how students think, reason, and understand the world." },
          { key: "D", text: "Classical education uses reading in place of meaningful discussion." },
        ],
        correct: "C",
        incorrectFeedback: `Not quite. Classical education does not value reading
          simply because an assignment is long or because students need to finish a
          certain number of books. Try again.`,
        correctFeedback: `
          <p>Great books, real literature, primary sources, and rich ideas are
          central to classical education. Rather than relying only on watered-down
          summaries or textbooks, students encounter meaningful works and learn to
          engage with the ideas inside them.</p>
          <p>This is not reading merely for reading's sake. This kind of reading
          shapes how a student thinks, reasons, and sees the world.</p>
          <p>Families coming from another educational background may find the amount
          of reading challenging at first, especially if their student has not read
          this way before. Give it time. Students often grow into it as parents
          encourage them and walk alongside them.</p>
          <p>Students who have grown up with classical education may be ready for
          more, and families are always welcome to add additional reading.</p>
          <p>At Compass, we work to strike a balance. We want the weekly work to be
          rich but attainable so students can come prepared for stronger
          conversations when we gather together. Those conversations help students
          understand and retain what they are learning.</p>`,
      },

      // ---- SCREEN 4: MORE THAN CLASSICAL ----------------------------
      {
        kind: "reveal",
        icon: "anchor",
        heading: "At Compass, Classical Education Is Only Part of the Picture",
        prompt: "What anchors everything we do?",
        body: `
          <p>Everything we do is anchored in a Biblical worldview.</p>
          <p>We do not simply want students who are well read and well spoken.
          Those are good things, but they are only the beginning of what we hope for
          our students.</p>
          <p>We want students who know truth and who know the One who is Truth.</p>
          <p>Every subject, from mathematics and science to history, literature, and
          Latin, is approached with the understanding that God is the author of all
          knowledge. Pursuing wisdom is ultimately part of pursuing Him.</p>`,
      },

      // ---- SCREEN 5: DO NOT SKIP THIS PART --------------------------
      {
        kind: "reveal",
        icon: "chat",
        heading: "Do Not Skip the Biblical Discussion Questions",
        intro: `<p>On nearly every guide page, you will find discussion questions
          that carry that week's subject into a Biblical context.</p>`,
        prompt: "Why do these questions matter?",
        body: `
          <p>Please do not skip these questions.</p>
          <p>Beautiful things can come from sitting down together, talking through
          them, and finding God in the midst of science, Latin, history, literature,
          and every other subject.</p>
          <p>This is part of the beauty of you being the teacher. Compass is here to
          guide your way, but you have the privilege of having these conversations
          with your own student.</p>
          <p>We provide the conversation starters. You get to listen, discuss, and
          help your student see God in every subject.</p>
          <p>When this part is skipped, families miss much of what Compass is here to
          provide.</p>`,
      },

      // ---- SCREEN 6: WHERE IS THIS LEADING? -------------------------
      {
        kind: "cards",
        icon: "sprout",
        heading: "What Are We Hoping to Cultivate?",
        intro: `<p>Classical Christian education is not only about completing
          assignments or preparing for a future career. It is about helping form the
          whole student.</p>`,
        cards: [
          {
            icon: "bulb",
            title: "Think",
            body: "We want students who can examine ideas carefully and thoughtfully.",
          },
          {
            icon: "scales",
            title: "Reason",
            body: "We want students who can recognize truth, evaluate ideas, and think logically.",
          },
          {
            icon: "chat",
            title: "Articulate",
            body: `We want students who can communicate clearly and express their
              faith with confidence, grace, and truth.`,
          },
          {
            icon: "compass",
            title: "Live Wisely",
            body: `We want students prepared not merely for a career, but for a life
              marked by wisdom and virtue.`,
          },
        ],
        summary: `Classical education is not always the swiftest or easiest path,
          but it is a beautiful one. Walking it in community means you are not alone.
          Our hope is to guide you as you help form students who can think, reason,
          articulate their faith, and pursue lives of wisdom and virtue. We are so
          glad you are here, and we cannot wait for you to see the fruit take root in
          your own family.`,
      },
    ],
  },

  // ---- ACADEMIC EXPECTATIONS ----------------------------------------
  // Starts with one screen (the weekly-work notebook). A second topic
  // (students arriving with work done) will be added as screen 2 later; when it
  // is, completion will require finishing both screens.
  academics: {
    screens: [
      {
        kind: "reveal",
        icon: "book",
        heading: "Set Up a Weekly Work Notebook",
        imageSrc: "/public/notebook.png",
        prompt: "Click the notebook to learn how to organize your student's weekly work.",
        body: `
          <p>Each student should have a binder or notebook divided by subject.</p>
          <p>Students will use it to complete and store their weekly work for each
          class. Keeping everything organized in one place helps students arrive
          prepared and know exactly where to find their work during class.</p>
          <p>Throughout the weekly guides, you may see instructions such as:</p>
          <ul>
            <li>Complete this and place it in your notebook.</li>
            <li>Jot your answer in your notebook.</li>
            <li>Bring your notebook to class.</li>
          </ul>
          <p>This binder or notebook is what those instructions are referring to.</p>

          <h4>University Ready Writing</h4>
          <p>Students in 10th and 11th grade will organize their University Ready
          Writing notebook according to IEW's specific instructions. The videos for
          this class will walk you through exactly how to set up that notebook.</p>

          <h4>Best Practice</h4>
          <p>Science work can accumulate quickly throughout the year. You may find
          it helpful to use a separate science notebook or binder with its own tabs.
          This is optional, but it is something to consider when deciding how to
          organize your student's materials.</p>

          <h4>Closing Reminder</h4>
          <p>The exact system you choose may vary, but the goal is simple: your
          student should have one organized place for weekly work so it is completed,
          easy to find, and ready to bring to class.</p>`,
      },
    ],
  },

  // ---- ANCHORED AT HOME ---------------------------------------------
  anchored: {
    screens: [
      {
        kind: "cards",
        icon: "anchor",
        heading: "Anchored at Home",
        intro: `
          <p>Every Compass family receives an <strong>Anchored at Home</strong> page
          for each week of study.</p>
          <p>This page is designed to help your entire family learn together,
          regardless of the ages of your children. It brings Scripture, music,
          poetry, art, and literature into one shared family rhythm.</p>`,
        imageSrc: "/public/anchored-week1.jpg",
        imagePrompt: "Click each section to discover how your family can use Anchored at Home.",
        cards: [
          {
            icon: "book",
            title: "Scripture",
            body: `
              <p>Each week includes two opportunities for your family to spend time
              in Scripture together.</p>
              <p>The <strong>memory verse</strong> connects with the Claritas
              curriculum used at the Cornerstone level, but it can be learned and
              discussed by the entire family, regardless of age.</p>
              <p>The page also includes a <strong>Scripture reading</strong>
              connected to the history being studied through BiblioPlan.</p>
              <p>These selections give your family a simple way to gather around
              God's Word and connect it with what your children are learning
              throughout the week.</p>`,
          },
          {
            icon: "music",
            title: "Hymn Study",
            body: `
              <p>Each page includes a hymn for your family to study together.</p>
              <p>You can read and discuss the words, learn a little about the hymn's
              history, and use the provided questions to guide a simple family
              conversation.</p>
              <p>A QR code will take you to a recording so your family can listen to
              the hymn together.</p>`,
          },
          {
            icon: "pen",
            title: "Poetry",
            body: `
              <p>The poetry section introduces your family to a poet and one or more
              of the poet's works.</p>
              <p>Scan the QR code to find a brief biography of the poet and a
              collection of poems your family can explore.</p>
              <p>The selected poetry also connects with BiblioPlan's suggestions for
              family study. You might choose to create a simple weekly poetry teatime,
              gather around the table with a snack or warm drink, and enjoy reading
              poetry aloud together.</p>
              <p>The purpose is not to analyze every line. It is to help your children
              become familiar with beautiful language and enjoy poetry as a family.</p>`,
          },
          {
            icon: "art",
            title: "Art Appreciation",
            body: `
              <p>A work of art appears at the center of each Anchored at Home page.</p>
              <p>Each five-week unit focuses on one artist. During those five weeks,
              your family will view different works by that artist, learn some of the
              artist's history, and use simple questions to discuss what you notice in
              the paintings.</p>
              <p>Three artists from the Anchored at Home pages will be a focus of one
              term in community, while three others will be explored only at home. By
              using these pages, your family can study six artists together over the
              course of this school year — one every five weeks.</p>
              <p>Art appreciation does not require special expertise. Simply look
              carefully, talk about what you notice, and allow your children time to
              become familiar with the artist's work.</p>`,
          },
          {
            icon: "music",
            title: "Composer Study",
            body: `
              <p>The composer section follows a rhythm similar to the art study.</p>
              <p>Your family will focus on one composer for each five-week unit. A QR
              code will take you to a different composition by that composer each
              week.</p>
              <p>After listening, you can use the provided questions to begin a
              conversation about that artist.</p>
              <p>You do not need to know a great deal about music to enjoy it
              together.</p>
              <p>Compass introduces composers in community, and Anchored at Home gives
              your family the opportunity to explore additional composers together.</p>`,
          },
          {
            icon: "people",
            title: "Family Read-Alouds",
            body: `
              <p>Each page includes literature suggestions connected to the historical
              era our community is studying this year. Every level is focusing on the
              same era so that families can have conversations together no matter the
              age differences in their children.</p>
              <p>These read-aloud selections are designed to enrich the learning of
              your whole family.</p>
              <p>Gather around the table, settle onto the couch, or read together in
              the evening. Younger and older students can listen together and build
              shared memories around the people, places, and events they are
              studying.</p>`,
          },
        ],
        summary: `
          <div class="lin-summary-title">Learn Together as a Family</div>
          <p>The beauty of Anchored at Home is that it is not designed for one
          particular grade or child. It is an invitation for your family to learn
          together.</p>
          <p>You might gather around the table, sit together on the couch, enjoy a
          cup of tea, listen to music, read poetry, look at a painting, or share a
          good book.</p>
          <p>You do not have to complete every section in one sitting or make each
          activity into a formal lesson. Use the page to create meaningful moments of
          shared learning throughout your week.</p>
          <p><strong>Anchored at Home helps bring your family together around truth,
          beauty, goodness, and the shared story you are studying as a
          community.</strong></p>`,
      },
    ],
  },
};
