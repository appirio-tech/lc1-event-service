# [serenity] event service

## Intro

This  is a  repo to store project serenity's events service (time based workflow, email notifications).   The consumers and producers may end up in the [challenge- app](https://github.com/appirio-tech/lc1-challenge-app) and/or the [discussion-service](https://github.com/appirio-tech/lc1-discussion-service) but for now the collection of workers will be stored here.  A node based worker queue called [Kue](https://github.com/learnboost/kue) will serve as the front to Redis.   It includes a simple yet nice UI and also supports REST calls for job management.   We will define a producer a piece of code that adds a job to a queue and a consumer as a piece of code that processes a job from a queue and removes it.   If you have ever used any MQTT based products, you will find [Kue](https://github.com/learnboost/kue) an easy REST based alternative much like Resqueue.

## Local Setup

1.  First make sure that you have redis installed and running in your local environment.  I suggest you run `redis-server` in this directory so you can blow away your rdb file to start with a fresh db f you need to.
2. Next start the web interface `node ui.js` and hit your with your browser on port 3000
3. There are four other node files, 2 producers ( 3getReadyForReview.js and 4getResetChallenges.js) and 2 consumers (3setToReview and 4setToSubmission)

## Heroku Setup
*** Enviromental Variables ***

| Name of variable	| Default value|
|---|---|
| KUE_PREFIX | 	'q'|
| SERENITY_CHALLENGE_API |	The URL of the API. Defaults to 'http://dev-lc1-challenge-service.herokuapp.com/challenges'|
| REDISTOGO_URL |	Available with Heroku's redistogo addon.|
| REDISCLOUD_URL |	Available with Heroku's rediscloud addon.|
| OPENREDIS_URL |	Available with Heroku's ropenredis addon.|
| REDISGREEN_URL |	Available with Heroku's redistgreen addon.|
| REDIS_PORT |	Used on local deployment setup. Defaults to 6379.|
| REDIS_HOST |	Used on local deployment setup. Defaults to '127.0.0.1'.|
| RETRY_ERRORED_REQUESTS_AFTER |	When HTTP requst fails retry it after ms. Defaults to 3000.|
| REVIEW_QUEUE_NAME |	The name used for the queue. Defaults to 'ready_for_review'.|
| REVIEW_JOBS_PRIORITY |	Default priority for preview jobs. Defaults to 'normal'.|
| REVIEW_JOBS_ATTEMPTS |	Retry attempts for jobs. Defaults to 3.|
| REVIEW_POLL_INTERVAL |	In local env poll for changes every this ms. Defaults to 60000. Only when AUTO_POLLING is true.|
| REVIEW_DEV_FILTER |	When NODE_ENV is not 'production' use this string to filter challenges by overview text. Defaults to 'Kue refactor --kiri4a test'.|
| AUTO_POLLING |	When set to true in local env producer will auto-poll for new data from the API.|
| PORT |	Port to run the Kue's admin UI. Defaults to 3333.|
| NODE_ENV |	Defaults to unset. Set to 'production' when go live.|
| AUTH_USER |	When NODE_ENV='production' Basic HTTP Auth will protect the kue's admin ui. This is the user to login. Defaults to 'foo'.|
| AUTH_PASS |	When NODE_ENV='production' Basic HTTP Auth will protect the kue's admin ui. This is the pass to login. Defaults to 'bar'.|
| MYTOKEN| as a temporary measure I put in my auth bearer token when working with the authenticated api |


## Workers

### 3getReadyForReview.js *- Producer*
>Makes a call to the [dev-challenge-service](http://dev-lc1-challenge-service.herokuapp.com) (no authentication required) and gets all the challenge records who have a status = "SUBMISSION" and whose subEndAt is before `now()`.   These are challenges that are in the submission phase and need to be switch to the ***"Review"*** phase.  These jobs (records) are placed on a queue called `ready_for_review`.   This job uses REVIEW_POLL_INTERVAL for a interval timer.

### 3setToReview.js *- Consumer*
>This consumer reads from the `ready_for_review` and makes a ***PUT*** call to the [dev challenge service](http://dev-lc1-challenge-service.herokuapp.com) update the status from ***SUBMISSION*** to ***REVIEW***.  In addition to sending the new status in the payload it also must pass two required fields:  *title* and *projectSource*.  Since they are required by the API.


### 4getResetChallenges.js *- Producer*

>This `utility worker` Producer is very similar to the other getter and was only created to aid in development by resetting some challenges back to ***SUBMISSION***   It takes 8 challenges who's subEndAt is in the past and adds them to a queue called `reset_test_challenges` to be picked up by it's corresponding consumer (4setToSubmission.js)

### 4setToSubmission.js *- Consumer*
>This `utility worker` Consumer is just like 3setToReview.js but it sets these 8 challenges back to ***SUBMISSION*** regardless of there status.

### 5getChallengesforMail.js *- Producer*
>gets the latest 2 challenges (arbitrary) and enqueues them to test_email so we can use them to send some test emails.

### 5sendEmail.js *- Consumer*
>send sample emails with the challenge title and description from the queue test_email

Currently these workers are dumb and won't check for duplicates.   As a matter of fact both the getters (producers) and setters (consumers)  are on an intervall so the getters will create duplicate records every 10 seconds.   The setters are on an interval too but once the queue is empty they don't do anything.

Since the dev challenge service is shared by a number of developers you will need to be carefull that others aren't moving your records around.   You may need to color your data to make sure you are the one updateing it.   For example in your setters you may add your handle to the title or set the source to your handle.   You may also need to modify your getters to get a smaller subset of controlled records.   Look at the [swagger docs](http://dev-lc1-challenge-service.herokuapp.com/docs/) for the challenge service and pay attention to the filters and  fields parmaters.
