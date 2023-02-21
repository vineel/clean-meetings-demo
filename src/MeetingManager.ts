import * as ChimeSDK from 'amazon-chime-sdk-js';
import { MeetingInfo } from './MeetingInfo';




export class MeetingManager {
    meetingInfo: MeetingInfo;
    logger: ChimeSDK.Logger;
    deviceController: ChimeSDK.DefaultDeviceController | undefined = undefined;
    meetingSession: ChimeSDK.MeetingSession | undefined = undefined;
    eventReporter: ChimeSDK.EventReporter | undefined = undefined;
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
            meetingId:          this.meetingInfo?.getMeetingId(),
            externalMeetingId:  this.meetingInfo.getExternalMeetingId(),
            attendeeId:         this.meetingInfo?.getAttendeeId(),
            previewIsOn:        this.previewVideoElement !== null
        };
    }

    /*
        returns one Video Input device (e.g. webcam) from the list of video input devices on this computer
    */
    async getVideoDevice(index:number = 0): Promise<MediaDeviceInfo | undefined> {
        const videoInputs: MediaDeviceInfo[] = await this.meetingSession?.audioVideo?.listVideoInputDevices(true);
        if (videoInputs && index < (videoInputs.length-1)) {
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
                this.eventReporter // this is undefined bec I don't know how to use it
            )
        );
        this.audioVideo = this.meetingSession.audioVideo;
        console.log("meetingSession:", this.meetingSession);

        const firstVideoInputDevice = await this.getVideoDevice(0);
        console.log("found firstVideoInputDevice: ", firstVideoInputDevice);

        await this.meetingSession.audioVideo.chooseVideoInputQuality(960, 540, 15); // 540p 15fps
        await this.meetingSession.audioVideo.setVideoMaxBandwidthKbps(1400);
        await this.meetingSession.audioVideo.startVideoInput(firstVideoInputDevice.deviceId);
    }

    async previewStart(videoElement: HTMLVideoElement):Promise<void> {
        this.previewVideoElement = videoElement;
        this.audioVideo?.startVideoPreviewForVideoInput(this.previewVideoElement);
        console.log('video preview started')
    }

    async previewStop():Promise<void> {
        if (this.previewVideoElement) {
            await this.audioVideo.stopVideoPreviewForVideoInput(this.previewVideoElement);      
            this.previewVideoElement = null;
        }
    }

}

