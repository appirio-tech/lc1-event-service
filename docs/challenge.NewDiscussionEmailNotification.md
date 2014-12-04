# [serenity] New Disccsion email Notification with Kue and sendgrid


Like food, water, shelter, and fire, sending emails when a discussion message is posted to a site is a fundamental skill for survival.  This exploratory challenge will allow you to use two of our serenity apis, Kue (node job queue), and sendgrid to send email notifications.


The goal of this challenge is create a mechanism to notify participant on a challenge when a new discussion message is created.   The notification will be an email with the body of the message. We build off our previous challenge of using Kue as a worker queue platform.  The flow would be something like this:

### Flow
 1. A new discussion thread is created by a participant of the challenge
 2. The discussion service will use the Kue api to create a new queue [name: 60_new_discussion_message] that includes all the details of the discussion message. (1 job)
 3. A consumer/producer  [file name: 6getParticpantsForDiscussionNotification.js ]  will parse that job for the challenge id, message content and author of the message, and will call to the discussion service to get all the participants.
 4. The list of participants will be added to the new queue [name: 61_sendDiscussionNotification ] but the author of the message should be removed. (  this may be one job for all the participants or 1 job per participant ) and should include the message content, challenge name, and author of the message.
 5. A consumer [file name: 6sendDiscussionNotificationEmails.js ] will work of the  61_sendDiscussionNotification queue and email each participant the content of the new discussion post, and complete the job.

 If you have used thr forums at topcoder you should have a pretty good idea of how this flow works.   The major difference is that these discussion.messages are less forum style and more github style, meaning a single threaded message attached to an object.  Our current dev systems do not have all the data you need yet so you will have to simulate some things.  For example we don't resolve the email as of yet so you will have to simulate the userId as the email.  Also of course you can't send these emails out to the participants so you should send them to yourself (or me) and just put the userId and Role in the Subject header along with the text "New Discussion post for challenge {{challenge.name }} by {{message.createdBy}}"

 ---

### Here are some api calls to get you started:

A.  a discussion call with the messages expanded:
    http://dev-lc1-discussion-service.herokuapp.com/discussions/19?fields=id,remoteObjectId,remoteObjectKey,messages

returns the following

```json
{
  success: true,
  status: 200,
  content: {
    id: 19,
    remoteObjectId: 5,
    remoteObjectKey: "challenge",
    messages: [
      {
        id: 89,
        discussionId: 19,
        parentMessageId: null,
        createdBy: 40015039,
        updatedBy: 40015039,
        content: "All your base are belong to us",
        createdAt: "2014-11-21T18:23:15.826Z",
        updatedAt: "2014-11-21T18:23:15.826Z"
      },
      {
        id: 90,
        discussionId: 19,
        parentMessageId: null,
        createdBy: 40015039,
        updatedBy: 40015039,
        content: "Chicken parm you taste so good",
        createdAt: "2014-11-21T18:28:25.382Z",
        updatedAt: "2014-11-21T18:28:25.382Z"
      }
    ]
  }
}
```

This is for challenge 5(remoteObjectKey) and it contains two messages.   You won't actual have to make this call since the discussion service will post this to the kue api.   But you should simulate this call with a curl to create the job.    See the kue docs for examples.

---

B.  Once you have 1 message from the above payload in you queue, you will need to call the challenge service for challenge id 5.  since challenge id 5 only has one participan I am going to switch this simulation to challenge 3.  The following call will get the particpants for challenge 3

    http://dev-lc1-challenge-service.herokuapp.com/challenges/3/participants

as and alternaitve you could do a call to challenge 3 a specify the fields you want include the participants with this call

    http://dev-lc1-challenge-service.herokuapp.com/challenges/3?fields=id,title,participants


## Requirements

1. Download the base code from the [event-service repo](https://github.com/appirio-tech/lc1-event-service)
2. Look at the docs/challenge.NewDiscussionEmailNotification.md doc for more details on the api calls you will need.
3. Create a curl script that will add a job to the  60_new_discussion_message queue by passing the minimum fields:  challengeId, messageId, createdBy, createdAt and content.   You can parts of the above json payload for inspiration.
4.  Create the appropriate producers and consumers as described in the Flow that will result in send mock emails to the participants of the challenge minus the author.
5. The end goal of this challenge is to send actual emails but only to yourself and the subject of email will contain the userid or handle to simulate the actual mailto address of all the participants.  You can look the the consumer/producers with the 5 prefix to get an idea of how the mail functionality works but it is pretty trivial.    You will need to sign up for a free account with sendgrid and you may use topcoder.com as the website in the signup.  The sendgrid node module is in the package.json so all you need to do is put your `SENDGRID_USERNAME` and `SENDGRID_USERNAME`  in a .env file.  (.env* is in gitignore but be sure to delete yours when you submit.)
6. Address error handling and retries as you see necessary.  Since the discussion services (your simulate curl call) will be making the first job you can assume that it is not necessary to check for duplicates but it would be nice.
7. The result of this challenge is not deployment ready code but it should prove it works That being said you have some liberties to make some choices that will allow for flexibility, scaleability and ease of use.  Please read the other challenge doc in the repo and the Readme for setup instructions and more context.

## Submission Guidelines:
1. Submit your src as a single zip file which includes the .git dir
2. Submit a short video of your solution in action (links to screencast, youtube, dropbox are preferred over video file uploads.)  If English is not your first language you are welcome to annotate you video with text over narration.
3. Submit a detail description of you implementation and recommendation.  
