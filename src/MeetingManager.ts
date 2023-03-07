import * as ChimeSDK from 'amazon-chime-sdk-js';
import { DefaultVideoTransformDevice } from 'amazon-chime-sdk-js';
import { MeetingInfo } from './MeetingInfo';



export interface UIInfo {
  meetingId: string,
  externalMeetingId: string,
  attendeeId: string,
  previewIsOn: boolean;
}

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
  originalVideoDeviceId: string | null = null;
  transformVideoDevice: DefaultVideoTransformDevice | null = null;

  constructor(meetingInfoApiEndpoint: string) {
    this.meetingInfo = new MeetingInfo(meetingInfoApiEndpoint);
  }

  /*
      returns any information that the user interface needs to show the user
  */
  getInfo(): UIInfo {
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
    if (videoInputs && index < videoInputs.length) {
      const inputDevice = videoInputs[index]; // probably your main webcam
      return inputDevice;
    }
    return undefined;
  }

  /*
      does this minimum needed to start a meeting with video
  */
  async initialize(meetingId: string): Promise<void> {
    this.logger = new ChimeSDK.ConsoleLogger('Log');
    await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
    console.log("data:", this.meetingInfo.configuration);

    const configuration = this.meetingInfo.configuration;

    // this represents an interface the audio and video devices on the local computer
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
    const firstVideoInputDevice: MediaDeviceInfo = await this.getVideoDevice(0);
    this.originalVideoDeviceId = firstVideoInputDevice.deviceId;
    this.audioVideo.chooseVideoInputQuality(960, 540, 15); // 960w 540h 15fps
    this.audioVideo.setVideoMaxBandwidthKbps(1400);


    // get the object that manages the Video Grid UI
    const videoTileMgr: ChimeSDK.AudioVideoObserver = this.videoGridManager();
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
    if (await ChimeSDK.BackgroundBlurVideoFrameProcessor.isSupported()) {
      const blurProcessor = await ChimeSDK.BackgroundBlurVideoFrameProcessor.create();
      const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(this.logger, this.originalVideoDeviceId, [blurProcessor]);
      this.transformVideoDevice = transformDevice;
      await this.audioVideo.startVideoInput(transformDevice);
    }
  }

  async blurStop(): Promise<void> {
    console.log("blur stop!");
    if (this.transformVideoDevice) {
      await this.transformVideoDevice.stop();
      this.transformVideoDevice = null;
    }
    await this.audioVideo.startVideoInput(this.originalVideoDeviceId);
  }

  async replaceStart(imageUrl: string): Promise<void> {
    console.log("replace start!");
    if (await ChimeSDK.BackgroundReplacementVideoFrameProcessor.isSupported()) {
      const image = await fetch(imageUrl); 
      const imageBlob = await image.blob();
      const options = { imageBlob };
      const replacementProcessor = await ChimeSDK.BackgroundReplacementVideoFrameProcessor.create(null, options); 
      const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(this.logger, this.originalVideoDeviceId, [replacementProcessor]);
      this.transformVideoDevice = transformDevice;
      await this.audioVideo.startVideoInput(transformDevice);
    }      
  }

  async replaceStop(): Promise<void> {
    console.log("blur stop!");
    if (this.transformVideoDevice) {
      await this.transformVideoDevice.stop();
      this.transformVideoDevice = null;
    }
    await this.audioVideo.startVideoInput(this.originalVideoDeviceId);
  }


  /*
    videoGridManager is an AudioVideoObserver object.
    You can define lifecycle events such as audioVideoDidStart and respond to them.
    videoTiles are the built-in mechanism to show the video of the meeting.
    Each participant is shown on a VideoTile.
    The local user is shown on a special VideoTile, whose tile will have .localTile===true.
    videoTile.DidUpdate will be called whenever a particular video tile needs to be added, resized, etc.
  */
  videoGridManager(): ChimeSDK.AudioVideoObserver {
    // return an object that responds to lifecycle events on the remote video
    return {
      audioVideoDidStart: () => {
        console.log("audioVideoDidStart");
      },

      audioVideoDidStop: async (sessionStatus: ChimeSDK.MeetingSessionStatus) => {
        await this.audioVideo?.stopVideoInput();
      },

      videoTileDidUpdate: (tileState: ChimeSDK.VideoTileState) => {
        console.log("videoTileUpdated: ", tileState);
        if (tileState.localTile) {
          // This is a "local tile" which means it's coming from the camera on the local computer
          // You might label this "Me" or "Looking in a mirror"
          // Note: This Video is flipped -- if you see hold up a book, the letters will appear reversed
          // you can apply a canvasContext.scale(-1, 1) to your canvas to make it look "correct".
          const localVideoEl: HTMLVideoElement = document.getElementById('video-local') as HTMLVideoElement;
          this.audioVideo.bindVideoElement(tileState.tileId, localVideoEl);
        } else {
          const tileDomIdStr: string = tileState.tileId.toString();

          // is there already a DOM video element for this participant?
          if (!document.getElementById(tileDomIdStr)) {
            const parentDiv = document.getElementById('remote-grid');

            // there isn't, so let's create one
            const videoTileElement = document.createElement("video");
            videoTileElement.id = tileDomIdStr;
            videoTileElement.style.width = '100%';
            videoTileElement.style.height = '100%';
            parentDiv.appendChild(videoTileElement);
          }
          const tileEl = document.getElementById(tileDomIdStr) as HTMLVideoElement; // whether just created above or pre-existing
          this.audioVideo.bindVideoElement(tileState.tileId, tileEl);

        }
      },

      videoTileWasRemoved: (tileId: number) => {
        // tileId is the id of a DOM element that shows 1 video participant, added in "videoTileDidUpdate"
        // this might happen if a remote video attendee drops from the meeting.
        const videoElementRemoved = document.getElementById(tileId?.toString());
        videoElementRemoved.remove();
      }   
    };
  }
}
