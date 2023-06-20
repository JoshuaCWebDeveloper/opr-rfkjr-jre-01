import { Player as LiqvidPlayer, Script, usePlayer } from 'liqvid';
import React, { ReactElement, ReactNode, useEffect, useMemo } from 'react';
import styled from 'styled-components';

const StyledPlayer = styled.div`
    .lv-player {
        position: relative;
        height: 100%;
        width: initial;
    }

    .lv-canvas {
        user-select: initial;
        width: 100%;
        height: 100%;
    }

    .lv-controls {
        top: initial;
        bottom: 0;
        left: 0;
        width: 100%;
    }
`;

type Marker = {
    id: string;
    start: number;
    end: number;
};

type ChildData = {
    rawMarkers: Marker[];
    updatedChildren: ReactNode[];
};

const processChildren = (children: ReactNode): ChildData => {
    const extractMarkers = (node: ReactNode): ChildData => {
        if (!React.isValidElement(node)) {
            return { rawMarkers: [], updatedChildren: [node] };
        }

        const { props } = node as ReactElement;

        if (!props) {
            return { rawMarkers: [], updatedChildren: [node] };
        }

        const markers = [];
        let newProps = { ...props };

        if (props['data-exit']) {
            const enter = parseInt(props['data-enter']) || 0;
            const exit = parseInt(props['data-exit']) || 0;

            markers.push(
                { id: `timestamp/${enter}`, start: enter, end: enter },
                { id: `timestamp/${exit}`, start: exit, end: exit }
            );

            // update props
            newProps = {
                ...props,
                className: `${props.className || ''} lv-controlled-element`,
                'data-from-first': `timestamp/${enter}`,
                'data-from-last': `timestamp/${exit}`,
            };
        }

        const { rawMarkers: childMarkers, updatedChildren: childNodes } =
            loopChildren(props.children);

        // if we have children
        if (childNodes.length > 0) {
            newProps.children = childNodes;
        }

        const updatedNode = React.cloneElement(node, {
            ...newProps,
        });

        return {
            rawMarkers: [...markers, ...childMarkers],
            updatedChildren: [updatedNode],
        };
    };

    const loopChildren = (children: ReactNode): ChildData => {
        const rawMarkers = [] as Marker[];
        const updatedChildren = [] as ReactNode[];

        React.Children.toArray(children).forEach(node => {
            const { rawMarkers: childMarkers, updatedChildren: childNodes } =
                extractMarkers(node);
            rawMarkers.push(...childMarkers);
            updatedChildren.push(...childNodes);
        });

        return {
            rawMarkers,
            updatedChildren,
        };
    };

    return loopChildren(children);
};

const DisablePause = () => {
    // since this calls usePlayer(), cannot put directly in <MyVideo>
    const player = usePlayer();
    useEffect(() => {
        // disable pause on canvas click
        player.hub.on('canvasClick', () => false);
        // re-enable pause on video/audio click
        player.canvas.addEventListener('click', e => {
            // if target element is video or audio
            if (
                e.target instanceof HTMLVideoElement ||
                e.target instanceof HTMLAudioElement
            ) {
                // if paused
                if (player.playback.paused) {
                    // play
                    player.playback.play();
                } else {
                    // pause
                    player.playback.pause();
                }
            }
        });
    }, []);
    return null;
};

type PlayerProps = {
    className?: string;
    children: ReactNode;
    duration: number;
    onScriptChange?: (script: Script) => void;
};

export const Player = ({
    className = '',
    children,
    duration,
    onScriptChange,
}: PlayerProps) => {
    // extract marker info from our children and add marker props to them
    const { rawMarkers, updatedChildren } = processChildren(children);

    // convert raw markers to a full marker list
    const markers = useMemo(() => {
        const markers = rawMarkers
            .sort((a, b) => a.start - b.start)
            .reduce(
                (collection, current) => {
                    const { id, start } = current;
                    const last = collection.slice(-1)[0];

                    // if this is a duplicate
                    if (last.id === id) {
                        // ignore it
                        return collection;
                    }

                    // else, add it along with a segment
                    return [
                        ...collection,
                        {
                            id: `filler/${last.end}/${start}`,
                            start: last.end,
                            end: start,
                        },
                        current,
                    ];
                },
                [{ id: 'timestamp/0', start: 0, end: 0 }]
            );
        markers.push({
            id: 'duration',
            start: markers.slice(-1)[0].end,
            end: duration,
        });
        return markers.map(
            m => [m.id, m.start, m.end] as [string, number, number]
        );
    }, [JSON.stringify(rawMarkers)]);

    const script = useMemo(
        () => new Script(markers),
        [JSON.stringify(markers)]
    );

    // handle a possible script change
    useEffect(() => {
        onScriptChange?.(script);
    }, [script]);

    // hook into the LV show/hide functionality
    useEffect(() => {
        // get controlled elements
        const controlledElements = Array.from(
            document.querySelectorAll('.lv-canvas .lv-controlled-element')
        );

        // override setAttribute and removeAttribute for each element
        for (const element of controlledElements) {
            const originalSetAttribute = element.setAttribute.bind(element);
            const originalRemoveAttribute =
                element.removeAttribute.bind(element);
            const duration = parseInt(
                (element as HTMLElement).dataset?.transitionDuration || '300'
            );

            element.setAttribute = (name: string, value: string) => {
                if (name === 'aria-hidden' && value === 'true') {
                    element.classList.remove('lv-show');
                    element.classList.add('lv-hide');
                    element.classList.add('lv-exiting');
                    setTimeout(() => {
                        element.classList.remove('lv-exiting');
                    }, duration);
                }

                originalSetAttribute(name, value);
            };

            element.removeAttribute = (name: string) => {
                if (name === 'aria-hidden') {
                    element.classList.remove('lv-hide');
                    element.classList.add('lv-show');
                    element.classList.add('lv-entering');
                    setTimeout(() => {
                        element.classList.remove('lv-entering');
                    }, duration);
                }

                originalRemoveAttribute(name);
            };
        }
    }, []);

    return (
        <StyledPlayer>
            <LiqvidPlayer className={className} script={script}>
                {updatedChildren}

                <DisablePause />
            </LiqvidPlayer>
        </StyledPlayer>
    );
};

export default Player;
