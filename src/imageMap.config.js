// imageMap.config.js
//
// Content for "image map" interactions (a large reference image with clickable
// hotspots positioned over it), keyed by hotspot id. Rendered by imageMap.js.
//
// Each section has x/y as PERCENTAGES of the image (0–100), marking where its
// hotspot sits. These are estimates — refine them with the in-popup placement
// helper (open the site with ?editmap=1, open this popup, select a section, and
// click the image to place it), then paste the copied values back here.

export const IMAGE_MAPS = {
  anchored: {
    heading: "Anchored at Home",
    intro: `
      <p>Every Compass family receives an <strong>Anchored at Home</strong> page
      for each week of study. This page helps your entire family learn together,
      regardless of the ages of your children — bringing Scripture, music, poetry,
      art, and literature into one shared family rhythm.</p>`,
    imageSrc: "/public/anchored-week1.jpg",
    prompt: "Click each section on the page to discover how your family can use Anchored at Home.",
    sections: [
      {
        id: "scripture",
        title: "Scripture",
        x: 14,
        y: 26,
        body: `
          <p>Each week includes two opportunities for your family to spend time in
          Scripture together.</p>
          <p>The <strong>memory verse</strong> connects with the Claritas curriculum
          used at the Cornerstone level, but it can be learned and discussed by the
          entire family, regardless of age.</p>
          <p>The page also includes a <strong>Scripture reading</strong> connected to
          the history being studied through BiblioPlan.</p>
          <p>These selections give your family a simple way to gather around God's
          Word and connect it with what your children are learning throughout the
          week.</p>`,
      },
      {
        id: "hymn",
        title: "Hymn Study",
        x: 14,
        y: 52,
        body: `
          <p>Each page includes a hymn for your family to study together.</p>
          <p>You can read and discuss the words, learn a little about the hymn's
          history, and use the provided questions to guide a simple family
          conversation.</p>
          <p>A QR code will take you to a recording so your family can listen to the
          hymn together.</p>`,
      },
      {
        id: "poetry",
        title: "Poetry",
        x: 14,
        y: 80,
        body: `
          <p>The poetry section introduces your family to a poet and one or more of
          the poet's works.</p>
          <p>Scan the QR code to find a brief biography of the poet and a collection
          of poems your family can explore.</p>
          <p>The selected poetry also connects with BiblioPlan's suggestions for
          family study. You might choose to create a simple weekly poetry teatime,
          gather around the table with a snack or warm drink, and enjoy reading
          poetry aloud together.</p>
          <p>The purpose is not to analyze every line. It is to help your children
          become familiar with beautiful language and enjoy poetry as a family.</p>`,
      },
      {
        id: "art",
        title: "Art Appreciation",
        x: 86,
        y: 28,
        body: `
          <p>A work of art appears at the center of each Anchored at Home page.</p>
          <p>Each five-week unit focuses on one artist. During those five weeks, your
          family will view different works by that artist, learn some of the artist's
          history, and use simple questions to discuss what you notice in the
          paintings.</p>
          <p>Three artists from the Anchored at Home pages will be a focus of one term
          in community, while three others will be explored only at home. By using
          these pages, your family can study six artists together over the course of
          this school year — one every five weeks.</p>
          <p>Art appreciation does not require special expertise. Simply look
          carefully, talk about what you notice, and allow your children time to
          become familiar with the artist's work.</p>`,
      },
      {
        id: "composer",
        title: "Composer Study",
        x: 86,
        y: 60,
        body: `
          <p>The composer section follows a rhythm similar to the art study.</p>
          <p>Your family will focus on one composer for each five-week unit. A QR code
          will take you to a different composition by that composer each week.</p>
          <p>After listening, you can use the provided questions to begin a
          conversation about that artist.</p>
          <p>You do not need to know a great deal about music to enjoy it together.</p>
          <p>Compass introduces composers in community, and Anchored at Home gives
          your family the opportunity to explore additional composers together.</p>`,
      },
      {
        id: "literature",
        title: "Family Read-Alouds",
        x: 86,
        y: 84,
        body: `
          <p>Each page includes literature suggestions connected to the historical era
          our community is studying this year. Every level is focusing on the same era
          so that families can have conversations together no matter the age
          differences in their children.</p>
          <p>These read-aloud selections are designed to enrich the learning of your
          whole family.</p>
          <p>Gather around the table, settle onto the couch, or read together in the
          evening. Younger and older students can listen together and build shared
          memories around the people, places, and events they are studying.</p>`,
      },
    ],
    summary: `
      <div class="lin-summary-title">Learn Together as a Family</div>
      <p>The beauty of Anchored at Home is that it is not designed for one particular
      grade or child. It is an invitation for your family to learn together.</p>
      <p>You might gather around the table, sit together on the couch, enjoy a cup of
      tea, listen to music, read poetry, look at a painting, or share a good book.</p>
      <p>You do not have to complete every section in one sitting or make each activity
      into a formal lesson. Use the page to create meaningful moments of shared
      learning throughout your week.</p>
      <p><strong>Anchored at Home helps bring your family together around truth,
      beauty, goodness, and the shared story you are studying as a community.</strong></p>`,
  },
};
