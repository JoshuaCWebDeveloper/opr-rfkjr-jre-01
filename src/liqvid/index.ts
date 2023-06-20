import { Context, HTMLAttributes, PureComponent } from "react";
import {Playback, Player, Video} from "liqvid";

interface Props$1 extends HTMLAttributes<HTMLMediaElement> {
    obstructCanPlay?: boolean;
    obstructCanPlayThrough?: boolean;
    start?: number;
}

export declare class LiqvidMedia extends PureComponent<Props$1, Record<string, never>, Player> {
    protected playback: Playback;
    protected player: Player;
    protected domElement: HTMLMediaElement | null;
    /** When the media element should start playing. */
    start: number;
    static defaultProps: {
        obstructCanPlay: boolean;
        obstructCanPlayThrough: boolean;
    };
    static contextType: Context<Player>;
    
    get end(): number;
    pause(): void;
    play(): Promise<void>;
    onPlay(): void;
    onRateChange(): void;
    onSeek(t: number): void;
    onTimeUpdate(t: number): void;
    onVolumeChange(): void;
    onDomPlay(): void;
    onDomPause(): void;
}

export declare class LiqvidVideo extends LiqvidMedia {
    /** The underlying <video> element. */
    domElement: HTMLVideoElement;
    render(): JSX.Element;
}