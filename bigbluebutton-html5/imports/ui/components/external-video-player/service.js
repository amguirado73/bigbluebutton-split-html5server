import Meetings from '/imports/api/meetings';
import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import Logger from '/imports/startup/client/logger';

import { getStreamer } from '/imports/api/external-videos';
import { makeCall } from '/imports/ui/services/api';

import ReactPlayer from 'react-player';

import Panopto from './custom-players/panopto';

const isUrlValid = (url) => {
  return ReactPlayer.canPlay(url) || Panopto.canPlay(url);
}

const startWatching = (url) => {
  let externalVideoUrl = url;

  if (Panopto.canPlay(url)) {
    externalVideoUrl = Panopto.getSocialUrl(url);
  }

  makeCall('startWatchingExternalVideo', { externalVideoUrl });
};

const stopWatching = () => {
  makeCall('stopWatchingExternalVideo');
};

let lastMessage = null;

const sendMessage = (event, data) => {

  // don't re-send repeated update messages
   if (lastMessage && lastMessage.event === event
       && event === 'playerUpdate' && lastMessage.time === data.time) {
     return;
   }

   // don't register to redis a viewer joined message
  if (event === 'viewerJoined') {
    return;
  }

  lastMessage = { ...data, event };

  //const meetingId = Auth.meetingID;
  //const userId = Auth.userID;

  makeCall('emitExternalVideoEvent', { status: event, playerStatus: data });
};

const onMessage = (message, func) => {

  const streamer = getStreamer(Auth.meetingID);
  streamer.on(message, func);
};

const removeAllListeners = (eventType) => {
  const streamer = getStreamer(Auth.meetingID);
  streamer.removeAllListeners(eventType);
};

const getVideoUrl = () => {
  const meetingId = Auth.meetingID;
  const meeting = Meetings.findOne({ meetingId }, { fields: { externalVideoUrl: 1 } });

  return meeting && meeting.externalVideoUrl;
};

export {
  sendMessage,
  onMessage,
  removeAllListeners,
  getVideoUrl,
  isUrlValid,
  startWatching,
  stopWatching,
};
