import '@videojs/http-streaming';
import videojs, { VideoJsPlayer as Player } from 'video.js';
//import 'video.js/dist/video-js.css';
import { Player as LiqvidPlayer, Media } from 'liqvid';

import { PureComponent } from 'react';
import styled from 'styled-components';
import { LiqvidMedia, LiqvidProps } from '.';

const StyledWrapper = styled.div`
    position: relative;
    width: 100%;

    .vjs-hidden,
    &.vjs-controls-disabled .vjs-control-bar {
        display: none;
    }

    .vjs-seeking .vjs-loading-spinner,
    .vjs-waiting .vjs-loading-spinner {
        animation: vjs-spinner-show 0s linear 0.3s forwards;
        display: block;
    }

    .vjs-loading-spinner {
        background-clip: padding-box;
        border: 6px solid #2b333fb3;
        border-radius: 25px;
        box-sizing: border-box;
        display: none;
        height: 50px;
        left: 50%;
        margin: -25px 0 0 -25px;
        opacity: 0.85;
        position: absolute;
        text-align: left;
        top: 50%;
        visibility: hidden;
        width: 50px;
    }

    video {
        width: 100%;
    }
`;

export interface MediaControllerProps {
    start: number;
    domElement: HTMLMediaElement | null;
    end?: number;
    children?: React.ReactNode;
}

class MediaController extends (Media as unknown as typeof LiqvidMedia) {
    constructor(props: MediaControllerProps, context: LiqvidPlayer) {
        super(props, context);

        this.start = props.start;
        this.domElement = props.domElement;
    }

    override get end(): number {
        const props = this.props as MediaControllerProps;
        return typeof props.end == 'number' ? props.end : super.end;
    }

    override componentDidUpdate(): void {
        const props = this.props as MediaControllerProps;
        this.start = props.start;
        this.domElement = props.domElement;
    }

    override render() {
        return this.props.children;
    }
}

export interface VideoJsMediaProps extends LiqvidProps {
    playbackStart?: number;
    ['data-enter']?: number;
    ['data-exit']?: number;
    ['data-from-first']?: string;
    ['data-from-last']?: string;
    className?: string;
}

/** Liqvid equivalent of {@link HTMLVideoElement `<video>`}. */
export class VideoJs extends PureComponent<VideoJsMediaProps> {
    /** The underlying `video.js` player instance. */
    private videoJsPlayer?: Player;

    /** The underlying `<video>` element. */
    private videoDomElement?: HTMLVideoElement;

    private mediaController: MediaController | null = null;

    static override contextType = LiqvidPlayer.Context;

    static defaultProps = {
        playbackStart: 0,
    };

    decorateDomElement(domElement: HTMLVideoElement) {
        const { playbackStart } = this.props;

        return {
            ...domElement,
            addEventListener: domElement.addEventListener.bind(domElement),
            removeEventListener:
                domElement.removeEventListener.bind(domElement),
            play: domElement.play.bind(domElement),
            pause: domElement.pause.bind(domElement),
            get paused() {
                return domElement.paused;
            },
            get duration() {
                return domElement.duration - (playbackStart as number) / 1000;
            },
            get ended() {
                return (domElement.ended ||
                    domElement.classList.contains('lv-hide') ||
                    domElement.closest('.lv-hide')) as boolean;
            },
            get muted() {
                return domElement.muted;
            },
            set muted(muted: boolean) {
                domElement.muted = muted;
            },
            get volume() {
                return domElement.volume;
            },
            set volume(volume: number) {
                domElement.volume = volume;
            },
            get playbackRate() {
                return domElement.playbackRate;
            },
            set playbackRate(playbackRate: number) {
                domElement.playbackRate = playbackRate;
            },
            get readyState() {
                return domElement.readyState;
            },
            get videoWidth() {
                return domElement.videoWidth;
            },
            get videoHeight() {
                return domElement.videoHeight;
            },
            get src() {
                return domElement.src;
            },

            // Offset the time of the video to the start of the playback
            get currentTime() {
                return Math.max(
                    domElement.currentTime - (playbackStart as number) / 1000,
                    0
                );
            },
            set currentTime(time: number) {
                domElement.currentTime =
                    time + (playbackStart as number) / 1000;
            },
        };
    }

    instantiateVideoJs() {
        // videoDomElement is required
        if (!this.videoDomElement) {
            throw new Error('videoDomElement is required');
        }

        // Create the video.js player instance
        this.videoJsPlayer = videojs(this.videoDomElement, {
            html5: {
                hls: {
                    overrideNative: true,
                },
            },
            controls: false,
            bigPlayButton: false,
        });

        // enable play/pause on click
        this.videoJsPlayer.on('click', () => {
            // pass event to video element
            this.videoDomElement?.click();
        });
    }

    instantiateController() {
        // videoDomElement is required
        if (!this.videoDomElement) {
            throw new Error('videoDomElement is required');
        }

        this.mediaController = new MediaController(
            {
                start:
                    typeof this.props['data-enter'] == 'number'
                        ? this.props['data-enter']
                        : 0,
                domElement: this.decorateDomElement(this.videoDomElement),
                end: this.props['data-exit'],
            },
            this.context as LiqvidPlayer
        );
    }

    processWrapper(wrapper: HTMLDivElement) {
        let videoMounted = false;
        // add mutation observer to wrapper to unmount video when lv-hide class is added
        const observer = new MutationObserver(mutations =>
            mutations.forEach(mutation => {
                if (
                    mutation.type !== 'attributes' ||
                    mutation.attributeName !== 'class'
                ) {
                    return;
                }
                const target = mutation.target as HTMLDivElement;
                if (target.classList.contains('lv-hide') && videoMounted) {
                    videoMounted = false;
                    this.mediaController?.componentWillUnmount?.();
                    this.videoJsPlayer?.pause();
                } else if (
                    !target.classList.contains('lv-hide') &&
                    !videoMounted
                ) {
                    videoMounted = true;
                    this.mediaController?.componentDidMount?.();
                }
            })
        );

        observer.observe(wrapper, {
            attributes: true,
            attributeFilter: ['class'],
        });
    }

    override componentWillUnmount() {
        this.mediaController?.componentWillUnmount?.();
        // Dispose the video.js player instance
        if (this.videoJsPlayer) {
            this.videoJsPlayer.dispose();
        }
    }

    override render() {
        const {
            start: _3,
            children,
            obstructCanPlay: _1,
            obstructCanPlayThrough: _2,
            playbackStart: _4,
            ['data-enter']: dataEnter,
            ['data-exit']: dataExit,
            ['data-from-first']: dataFromFirst,
            ['data-from-last']: dataFromLast,
            className,
            ...props
        } = this.props;

        return (
            <StyledWrapper
                className={'video-container ' + className ?? ''}
                data-exit={dataExit}
                data-enter={dataEnter}
                data-from-first={dataFromFirst}
                data-from-last={dataFromLast}
                ref={node => {
                    if (!node) {
                        return;
                    }
                    this.processWrapper(node);
                }}
            >
                <video
                    ref={node => {
                        if (!node) {
                            return;
                        }
                        this.videoDomElement = node;
                        this.instantiateVideoJs();
                        this.instantiateController();
                    }}
                    className="video-js vjs-default-skin vjs-big-play-centered"
                    {...props}
                >
                    {children}
                </video>
            </StyledWrapper>
        );
    }
}
