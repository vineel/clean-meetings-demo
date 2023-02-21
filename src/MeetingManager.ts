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
    this.logger = new ChimeSDK.ConsoleLogger('Log');
    await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
    console.log("data:", this.meetingInfo.configuration);

    const configuration = this.meetingInfo.configuration;

    this.deviceController = new ChimeSDK.DefaultDeviceController(
      this.logger,
      { enableWebAudio: true }
    );
    console.log("deviceController:", this.deviceController);

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

    // save the primary interface to start/stop the meeting
    this.audioVideo = this.meetingSession.audioVideo;

    // get a video device and configure it
    const firstVideoInputDevice = await this.getVideoDevice(0);
    await this.audioVideo.chooseVideoInputQuality(960, 540, 15); // 960w 540h 15fps
    await this.audioVideo.setVideoMaxBandwidthKbps(1400);

    // get the object that manages the Video Grid UI
    const videoTileMgr: Object = this.videoGridManager();
    //add it to the meeting
    this.audioVideo.addObserver(videoTileMgr);

    // start the input coming from the video device, doesn't show it onscreen yet
    await this.audioVideo.startVideoInput(firstVideoInputDevice.deviceId);
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

  videoGridManager(): Object {
    // return an object that responds to lifecycle events on the remote video
    const observer = {
      audioVideoDidStart: () => {
        console.log("audioVideoDidStart");
      },

      audioVideoDidStop: async (sessionStatus: any) => {
        console.log("audioVideoDidSTOP");
        await this.audioVideo?.stopVideoInput();
      },

      videoTileDidUpdate: (tileState: any) => {
        console.log("videoTileUpdated!", tileState);
        if (tileState.localTile) {
          //todo What is a local tile? Is that the "me" video?
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
        }
      },

      videoTileWasRemoved: (tileId: any) => {
        // tileId is the id of a DOM element that shows 1 video participant
        // that we added in videoTileDidUpdate
        const videoElementRemoved = document.getElementById(tileId);
        videoElementRemoved.remove();
      }
    };
    return observer;
  }
}


/*
  meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElementNew);
    When done with preview



    document.getElementById('form-devices').addEventListener('submit', e => {
      e.preventDefault();
      AsyncScheduler.nextTick(async () => {
        try {
          this.showProgress('progress-join');
          await this.stopAudioPreview();
          await this.openVideoInputFromSelection(null, true);
          // stopVideoProcessor should be called before join; it ensures that state variables and video processor stream are cleaned / removed before joining the meeting.
          // If stopVideoProcessor is not called then the state from preview screen will be carried into the in meeting experience and it will cause undesired side effects.
          await this.stopVideoProcessor();
          await this.join();
          this.hideProgress('progress-join');
          this.displayButtonStates();
          this.switchToFlow('flow-meeting');

        } catch (error) {
          document.getElementById('failed-join').innerText = `Meeting ID: ${this.meeting}`;
          document.getElementById('failed-join-error').innerText = `Error: ${error.message}`;
        }
      });
    });


    const buttonVideo = document.getElementById('button-camera');
    buttonVideo.addEventListener('click', _e => {
      AsyncScheduler.nextTick(async () => {
        if (this.toggleButton('button-camera') === 'on' && this.canStartLocalVideo) {
          try {
            let camera: string | null = this.selectedVideoInput;
            if (camera === null || camera === 'None') {
              camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
            }
            await this.openVideoInputFromSelection(camera, false);
            this.audioVideo.startLocalVideoTile();
          } catch (err) {
            this.toggleButton('button-camera', 'off')
            fatal(err);
          }
        } else {
          await this.audioVideo.stopVideoInput();
          this.toggleButton('button-camera', 'off');
        }
      });
    });
*/