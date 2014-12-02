# [serenity] event service protoype

## Intro

This  is a temporary repo to store project serenity's events service.   The consumers and producers will most likey end up in the [challenge- app](https://github.com/appirio-tech/lc1-challenge-app) and/or the [discussion-service](https://github.com/appirio-tech/lc1-discussion-service).  [kue](https://github.com/learnboost/kue) by the folks at LearnBoost is a node job queue on top of Redis.   It includes a simple yet nice UI and also supports REST calls for job management.   We will define a producer a piece of code that adds a job to a queue and a consumer as a piece of code that processes a job from a queue and removes it.   If you have ever used any MQTT based products I think you will find [kue](https://github.com/learnboost/kue) a pleasent surprise in both its rich features and simplicity.

## Setup

1.  First make sure that you have redis installed and running in your local environment.  I suggest you run `redis-server` in this directory so you can blow away your rdb file to start with a fresh db f you need to.
2. Next start the web interface `node ui.js` and hit your with your browser on port 3000
3. There are four other node files, 2 producers ( 3getReadyForReview.js and 4getResetChallenges.js) and 2 consumers (3setToReview and 4setToSubmission)

### 3getReadyForReview.js *- Producer*
>Makes a call to the [dev-challenge-service](http://dev-lc1-challenge-service.herokuapp.com) (no authtecation required) and gets all the challenge records who have a status = "SUBMISSION" and whose subEndAt is before `now()`.   These are challenges that are in the submission phase and need to be switch to the ***"Review"*** phase.  These jobs (records) are placed on a queue called `ready_for_review`.   This job has an interval so it takes 10 seconds before you will see any logs on the console.    Once you got your records you should stob this job with CTRL^c  

### 3setToReview.js *- Consumer*
>This consumer reads from the `ready_for_review` and makes a ***PUT*** call to the [dev challenge service](http://dev-lc1-challenge-service.herokuapp.com) update the status from ***SUBMISSION*** to ***REVIEW***.  In addition to sending the new status in the payload it also must pass two required fields:  *title* and *projectSource*.  Since they are required by the API.


### 4getResetChallenges.js *- Producer*
>This Producer is very similar to the other getter and was only created to aid in development by resetting some challenges back to ***SUBMISSION***   It takes 8 challenges who's subEndAt is in the past and adds them to a queue called `reset_test_challenges` to be picked up by it's corresponding consumer (4setToSubmission.js)

### 4setToSubmission.js *- Consumer*
>This Consumer is just like 3setToReview.js but it sets these 8 challenges back to ***SUBMISSION*** regardless of there status.

Currently these workers are dumb and won't check for duplicates.   As a matter of fact both the getters (producers) and setters (consumers)  are on an intervall so the getters will create duplicate records every 10 seconds.   The setters are on an interval too but once the queue is empty they don't do anything.

Since the dev challenge service is shared by a number of devleopers you will need to be carefull that others aren't moving your records around.   You may need to color your data to make sure you are the one updateing it.   For example in your setters you may add your handle to the title or set the source to your handle.   You may also need to modify your getters to get a smaller subset of controlled records.   Look at the [swagger docs](http://dev-lc1-challenge-service.herokuapp.com/docs/) for the challenge service and pay attention to the filters and  fields parmaters.
