# uncoment the next line to fake out the workers and get no charge
#web: forewoman start -f ProcfileFree -p $PORT

# uncoment these lines to have 1 web and multiple workers
web: node ui.js
consumer3_setToReview: node 3setToReview.js
producer3_getMissedReadyForReview: node 3getMissedReadyForReview.js
producer3_getFutureReadyForReview: node 3getFutureReadyForReview.js
worker6_getParticipantsForNotification: node 6getParticpantsForDiscussionNotification.js
emailer6_mailDiscussionNotification: node 6sendDiscussionNotificationEmails.js
