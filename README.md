# Muslim Grow Up

Muslim Grow Up is a lightweight habit tracker for building spiritual, learning, health, and personal-growth routines. Progress points and streaks are motivational tools; they are not measures of a person's faith or worship.

## Features

- Create, edit, and remove habits with categories, daily or weekday schedules, and configurable point values.
- Choose from a full-day agenda template, from waking up through bedtime, spanning worship, learning, health, work, reflection, and family life.
- View habits as a chronological daily timeline and track completion by time block in the daily progress chart.
- View a live local clock with the current weekday and date, and set a target duration for each activity.
- Use a stopwatch with lap tracking and a countdown timer with pause, resume, reset, and restart controls.
- Set a greeting name and sound preference in Settings; open app information and the usage guide from the header.
- Choose the dark, light, or feminine color theme in Settings.
- Record daily check-ins and track consecutive scheduled days.
- Review a 7-day activity chart, a 30-day heatmap, levels, and achievement badges.
- Export and import a JSON backup from Settings.
- Use the responsive interface on desktop or mobile.

## Run

Open `index.html` in a modern browser. The interface loads Tailwind CSS and Lucide icons from CDNs, so an internet connection is needed for full styling and icons.

To install it as an app, host the files on HTTPS or open them from `localhost`, then use the install button in the header and accept the browser prompt. Opening the HTML directly as `file://` supports normal use but not PWA installation. On iOS, use the browser's Share menu and choose Add to Home Screen.

The app does not require an account or server. Habit history is saved in the current browser's local storage and does not sync between devices. Export a backup before clearing browser data or switching browsers.

## Technology

- HTML, CSS, and vanilla JavaScript
- Tailwind CSS CDN
- Lucide icons
- Canvas charts