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

    @keyframes vjs-spinner-show {
        to {
            visibility: visible;
        }
    }

    @keyframes vjs-spinner-spin {
        100% {
            transform: rotate(360deg);
        }
    }

    @keyframes vjs-spinner-fade {
        0% {
            border-top-color: #73859f;
        }
        20% {
            border-top-color: #73859f;
        }
        35% {
            border-top-color: white;
        }
        60% {
            border-top-color: #73859f;
        }
        100% {
            border-top-color: #73859f;
        }
    }
    .vjs-hidden,
    .vjs-controls-disabled .vjs-control-bar {
        display: none;
    }

    .vjs-control-text {
        clip: rect(0 0 0 0);
        border: 0;
        height: 1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
    }

    .vjs-seeking .vjs-loading-spinner,
    .vjs-waiting .vjs-loading-spinner {
        animation: vjs-spinner-show 0s linear 0.3s forwards;
        display: block;
        visibility: visible;
    }

    .vjs-seeking .vjs-loading-spinner:after,
    .vjs-seeking .vjs-loading-spinner:before,
    .vjs-waiting .vjs-loading-spinner:after,
    .vjs-waiting .vjs-loading-spinner:before {
        animation: vjs-spinner-spin 1.1s cubic-bezier(0.6, 0.2, 0, 0.8) infinite,
            vjs-spinner-fade 1.1s linear infinite;
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

        &:after,
        &:before {
            border: inherit;
            border-color: #fff #0000 #0000;
            border-radius: inherit;
            box-sizing: inherit;
            content: '';
            height: inherit;
            margin: -6px;
            opacity: 1;
            position: absolute;
            width: inherit;
        }
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

type OnRequestCallback = (
    url: string,
    options: videojs.XhrOptions
) => videojs.XhrOptions;
export interface VideoJsMediaProps extends LiqvidProps {
    playbackStart?: number;
    ['data-enter']?: number;
    ['data-exit']?: number;
    ['data-from-first']?: string;
    ['data-from-last']?: string;
    className?: string;
    onRequest?: OnRequestCallback;
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

        // add our xhr hooks
        if (this.props.onRequest) {
            videojs.Vhs.xhr.beforeRequest = (options: videojs.XhrOptions) => {
                options =
                    this.props.onRequest?.(
                        options.url ?? options.uri ?? '',
                        options
                    ) ?? options;
                return options;
            };
        }
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
            onRequest: _5,
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
