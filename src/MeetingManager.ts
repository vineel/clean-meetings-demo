import * as ChimeSDK from 'amazon-chime-sdk-js';
import { MeetingInfo } from './MeetingInfo';



/*
  MeetingManager runs the meeting.
  1. Registers with the "meeting" on the server
  2. Sets up audio and video devices on this computer, attaches them to the meeting session. Chooses the first webcam for convenience.
  3. Responds to the user starting/stopping media.
*/

export class MeetingManager {
  meetingInfo: MeetingInfo;
  logger: ChimeSDK.Logger;
  deviceController: ChimeSDK.DefaultDeviceController | undefined = undefined;
  meetingSession: ChimeSDK.MeetingSession | undefined = undefined;
  // eventReporter: ChimeSDK.EventReporter | undefined = undefined;
  audioVideo: ChimeSDK.AudioVideoFacade | null = null;
  previewVideoElement: HTMLVideoElement | null = null;

  constructor(meetingInfoApiEndpoint: string) {
    this.meetingInfo = new MeetingInfo(meetingInfoApiEndpoint);
  }

  /*
      returns any information that the user interface needs to show the user
  */
  getInfo(): Object {
    return {
      meetingId: this.meetingInfo?.getMeetingId(),
      externalMeetingId: this.meetingInfo.getExternalMeetingId(),
      attendeeId: this.meetingInfo?.getAttendeeId(),
      previewIsOn: this.previewVideoElement !== null
    };
  }

  /*
      returns one Video Input device (e.g. webcam) from the list of video input devices on this computer
  */
  async getVideoDevice(index: number = 0): Promise<MediaDeviceInfo | undefined> {
    const videoInputs: MediaDeviceInfo[] = await this.meetingSession?.audioVideo?.listVideoInputDevices(true);
    if (videoInputs && index < (videoInputs.length - 1)) {
      const inputDevice = videoInputs[index];
      return inputDevice;
    }
    return undefined;
  }

  /*
      does this minimum needed to start a meeting with video
  */
  async initialize(meetingId: string): Promise<void> {
    debugger;

    this.logger = new ChimeSDK.ConsoleLogger('Log');
    await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
    console.log("data:", this.meetingInfo.configuration);

    const configuration = this.meetingInfo.configuration;

    // this represents the audio and video devices on the local computer
    this.deviceController = new ChimeSDK.DefaultDeviceController(
      this.logger,
      { enableWebAudio: true }
    );
    console.log("deviceController:", this.deviceController);

    // this represents the whole running meeting, but doesn't start it yet
    this.meetingSession = new ChimeSDK.DefaultMeetingSession(
      configuration,
      this.logger,
      this.deviceController,
      new ChimeSDK.DefaultEventController(
        configuration,
        this.logger,
        null // EventReporter
      )
    );
    console.log("meetingSession:", this.meetingSession);

    // save the primary interface to start/stop the meeting (for convenience)
    this.audioVideo = this.meetingSession.audioVideo;

    // get a video device and configure it
    const firstVideoInputDevice = await this.getVideoDevice(0);
    this.audioVideo.chooseVideoInputQuality(960, 540, 15); // 960w 540h 15fps
    this.audioVideo.setVideoMaxBandwidthKbps(1400);


    // get the object that manages the Video Grid UI
    const videoTileMgr: Object = this.videoGridManager();
    //add it to the meeting
    this.audioVideo.addObserver(videoTileMgr);

    
    // start the input coming from the video device, doesn't show it onscreen yet
    await this.audioVideo.startVideoInput(firstVideoInputDevice.deviceId);

    // this will start the audio and video input devices
    this.audioVideo.start();
    this.audioVideo.startLocalVideoTile();

  }

  async previewStart(videoElement: HTMLVideoElement): Promise<void> {
    this.previewVideoElement = videoElement;
    this.audioVideo?.startVideoPreviewForVideoInput(this.previewVideoElement);
  }

  async previewStop(): Promise<void> {
    if (this.previewVideoElement) {
      await this.audioVideo.stopVideoPreviewForVideoInput(this.previewVideoElement);
      this.previewVideoElement = null;
    }
  }

  async blurStart(): Promise<void> {
    console.log("blur start!");
  }

  videoGridManager(): Object {
    // return an object that responds to lifecycle events on the remote video
    const observer = {
      audioVideoDidStart: () => {
        console.log("audioVideoDidStart");
      },

      audioVideoDidStop: async (sessionStatus: any) => {
        await this.audioVideo?.stopVideoInput();
      },

      videoTileDidUpdate: (tileState: any) => {
        console.log("videoTileUpdated!", tileState);
        if (tileState.localTile) {
          // This is a "local tile" which means it's coming from the camera on the local computer
          // You might label this "Me" or "Looking in a mirror"
          // Note: This Video is flipped -- if you see hold up a book, the letters will appear reversed
          const localVideoEl: HTMLVideoElement = document.getElementById('video-local') as HTMLVideoElement;
          this.audioVideo.bindVideoElement(tileState.tileId, localVideoEl);
        } else {
          // is there already a DOM video element for this participant?
          if (!document.getElementById(tileState.tileId)) {
            const parentDiv = document.getElementById('remote-grid');

            // nope, so let's create one
            const videoTileElement = document.createElement("video");
            videoTileElement.id = tileState.tileId;
            videoTileElement.style.width = '100%';
            videoTileElement.style.height = '100%';
            parentDiv.appendChild(videoTileElement);
          }
          const tileEl = document.getElementById(tileState.tileId) as HTMLVideoElement; // whether just created above or pre-existing
          this.audioVideo.bindVideoElement(tileState.tileId, tileEl);

        }
      },

      videoTileWasRemoved: (tileId: any) => {
        // tileId is the id of a DOM element that shows 1 video participant, added in "videoTileDidUpdate"
        const videoElementRemoved = document.getElementById(tileId);
        videoElementRemoved.remove();
      }
    };
    return observer;
  }
}
