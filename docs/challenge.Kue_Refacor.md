## [serenity]  Kue Refactor

Until now our [serenity] project has mostly relied  on CRUD opperations, but now we are ready to work on some time based workflows and event based workflows.  For example when a user launces a challenge the status is set to "SUBMISSION" which means the challenge is accepting submissions.   When the SubEndAt (Submission End time ) hits the challenge.status needs to switch to "REVIEW".   Another example is of an event base workflow.   When a challenge is in "SUMBISSION" and a participant creates a 'discussion' (a simpler version of forum post) to a challenge all the other participants (Owners, Reviewers and Submitters) need to get notified via email.  For this challenge we will focus on the first example.  And this should be a COOL challenge you wont want to miss since I am already supplying you with working code.

We are looking at Super Kool [kue](https://github.com/learnboost/kue) by the learnBoost folks to help us process challenges that need to switch status from SUBMISSION to REVIEW.   Look at this [repo](https://github.com/appirio-tech/lc1-event-service) and grok the readme.   It comes with two sets of consumers and produces that will find all the records that need the status changed, make the update  (files with 3 prefix).   As well as a set that can be used to swap them back (files with 4 prefix) to the SUBMISSION status so you can continue testing.


Requirements.

1. Refactor the two files with the '3' prefix to follow Node best practices, and remove the interval from the producer since we will schedule it later with Heroku scheduler.  Break code into named functions so it can easily be modified or patterned for other workers.
2. Implement error handling and describe your approach.
3. That is basically it for the must have requirements, the following are exploratory options to give us a better understanding of capablities of kue.   This is the first of many workers we have planned.  The email notification (described above)  should come out later this week, so start thinking about that as well.
4. We would like to know if it make sense for the produces to check for jobs already in the queue before they add them to avoid duplicates?   If this is a viable approach implement it, if not support your answer.
5.  The consumer gets an http response when the PUT call is made.   Does it make sense to add the job before done() is called?   Is this even possible?   If it is a sound choice then do it.
6.  My first consumer processed 10 records at a time since it was only writing to the console.   I removed this concurrency option since I had to make individual http calls.   Is they any advanatages to concurrent processing of http calls?  Would there be any impact to the challenge-service?  Describe or demonstrate you answer.
7. Describe a retry approach for both record updates and email notification.
8. We have an option to run these producers and consumer from a new standalone heroku app, or deploy them with our challenge-app as worker dynos.  There are pros and cons of each choice.   Pick a side and convince us why you are right.

Submission Guidelines:
1. Submit your src as a single zip file which includes the .git dir
2. Submit a short video of your solution in action (links to screencast, youtube, dropbox are preferred over video file uploads.)  If English is not your first language you are welcome to annotate you video with text over narration.
3. Submit a detail description of you implementation and recommendation.  
