import PropTypes from 'prop-types';
import React from 'react';
import {
    InteractionManager,
    PanResponder,
    StyleSheet,
    TextInput,
    Keyboard,
    TouchableOpacity, Dimensions
} from 'react-native';
import humps from 'humps';
import Svg, {G, Path, Line, Ellipse, Rect, Text} from 'react-native-svg';
import AwesomeAlert from "react-native-awesome-alerts";
import Pen from '../tools/pen';
import Point from '../tools/point';
import theme from '../../../constants/theme';
import {Box} from "react-native-design-utility";
import {Icon} from 'react-native-elements';
import {STATUS_BAR_HEIGHT} from "../../statusbar/GeneralStatusBarColorStyles";

const {width, height} = Dimensions.get("window");
export const convertStrokesToSvg = (strokes, layout = {}) => {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}">
      <g>
        ${strokes.map(e => {
        return `<${e.type.toLowerCase()} ${Object.keys(e.attributes).map(a => {
            return `${humps.decamelize(a, {separator: '-'})}="${e.attributes[a]}"`;
        }).join(' ')}/>`;
    }).join('\n')}
      </g>
    </svg>
  `;
};

/* Styling */
let styles = StyleSheet.create({
    drawContainer: {
        flex: 1,
        display: 'flex',
    },
    checkIcon: {
        justifyContent: 'space-between',
    },
    iconShadow: {
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 1,
        },
    },
});

let flag = 0;
// let this.props.actionType = ''
export default class DrawPad extends React.Component {

    static propTypes = {
        drawActive: PropTypes.bool,
        strokes: PropTypes.array,
        strokeWidth: PropTypes.number,

        editOpacity: PropTypes.number,
        simplifyTolerance: PropTypes.number,
        color: PropTypes.string,
        containerStyle: PropTypes.any,
        lineGenerator: PropTypes.func,

        handleEditText: PropTypes.func,
        onChangeStrokes: PropTypes.func,
        onRewind: PropTypes.func,
        onClear: PropTypes.func,
        actionType: PropTypes.string,
        moveAble: PropTypes.bool,
    }
    /**************************************************/
    static defaultProps = {
        drawActive: true,
        strokes: null,
        strokeWidth: 4,
        editOpacity: 0.7,
        simplifyTolerance: 1,
        color: "#000000",
        containerStyle: null,
        lineGenerator: null,
        actionType: '',
        moveAble: false,

        onChangeStrokes: () => {
        },
        onRewind: () => {
        },
        onClear: () => {
        },
    }

    /**************************************************/
    constructor(props, context) {
        super(props, context);
        this.state = {
            currentPoints: [],
            previousStrokes: this.props.strokes || [],
            startTouchX: 0,
            startTouchY: 0,
            endTouchX: 0,
            endTouchY: 0,
            newStroke: [],
            text: '',
            pen: new Pen(),
            action: '',
            index: null,
            showAlert: false,
            alertTitle: 'Choose Element',
            alertMessage: 'Please choose element to move!'
        };

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gs) => {
                if (this.props.actionType !== '' || this.props.moveAble) {
                    this.setState({
                        startTouchX: Math.trunc(evt.nativeEvent.locationX),
                        startTouchY: Math.trunc(evt.nativeEvent.locationY),
                    });
                    // this.forceUpdate();
                }
            },
            onMoveShouldSetPanResponder: (evt, gs) => true,
            // onPanResponderGrant: (evt, gs) => {!this.props.editableText && this.onResponderGrant(evt, gs)},
            // onPanResponderMove: (evt, gs) => {!this.props.editableText && this.onResponderMove(evt, gs)},
            // onPanResponderRelease: (evt, gs) => {!this.props.editableText && this.onResponderRelease(evt, gs)},
            onPanResponderGrant: (evt, gs) => {
                this.onResponderGrant(evt, gs)
            },
            onPanResponderMove: (evt, gs) => {
                this.onResponderMove(evt, gs)
            },
            onPanResponderRelease: (evt, gs) => {
                this.onResponderRelease(evt, gs)
            },
        });
    }

    /****************************************************************************************************/
    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.previousStrokes !== nextState.previousStrokes) {
            return true;
        }
        if (this.state.currentPoints !== nextState.currentPoints) {
            return true;
        }
        return this.state.newStroke !== nextState.newStroke;

    }

    /**************************************************/
    componentWillReceiveProps(newProps) {
        if (this.props.strokes !== newProps.strokes) {
            if (newProps.strokes !== this.state.previousStrokes) {
                this.setState({
                    currentPoints: this.currentPoints || [],
                    previousStrokes: newProps.strokes,
                    newStroke: [],
                });
            }
        }
        // if (this.props.actionType !== newProps.actionType) {
        //     this.props.actionType = newProps.actionType
        //     this.forceUpdate();
        // }
    }

    /****************************************************************************************************/
    rewind = () => {
        let currentPoints = this.currentPoints || this.state.currentPoints;
        if (currentPoints.length > 0 || this.state.previousStrokes.length < 1) {
            return;
        }
        let strokes = this.state.previousStrokes;
        strokes.pop();

        this.state.pen.rewindStroke();
        this.currentPoints = [];
        this.setState({
            previousStrokes: [...strokes],
            currentPoints: [],
        }, () => {
            this._onChangeStrokes([...strokes]);

            if (this.props.onRewind) {
                this.props.onRewind();
            }
        });
    }
    /**************************************************/
    clear = () => {
        this.setState({
            previousStrokes: [],
            currentPoints: [],
            newStroke: [],
        }, () => {
            this.currentPoints = [];
            this._onChangeStrokes([]);

            if (this.props.onClear) {
                this.props.onClear();
            }
        });

        this.state.pen.clear();
    }
    /**************************************************/
    exportToSVG = () => {
        const strokes = [...this.state.previousStrokes];
        return convertStrokesToSvg(strokes, this._layout);
    }
    /**************************************************/
    updateStrokes = (data = {}) => {
        requestAnimationFrame(() => {
            this.setState({...data});
        });
    }
    /****************************************************************************************************/
    onTouch = (evt) => {
        if (!this.props.moveAble && flag === 0) {
            if (!this.props.drawActive) {
                return;
            }
            if (this.props.actionType !== '') {
                this.setState({
                    endTouchX: Math.trunc(evt.nativeEvent.locationX),
                    endTouchY: Math.trunc(evt.nativeEvent.locationY),
                });
                this.forceUpdate();
            }
            let x, y, timestamp;
            [x, y, timestamp] = [evt.nativeEvent.locationX, evt.nativeEvent.locationY, evt.nativeEvent.timestamp];

            let newPoint = new Point(x, y, timestamp);
            let newCurrentPoints = (this.currentPoints || this.state.currentPoints).slice();
            newCurrentPoints.push(newPoint);

            this.currentPoints = newCurrentPoints;

            this.updateStrokes({
                currentPoints: newCurrentPoints,
            });
        }
    }

    /**************************************************/
    onResponderGrant(evt) {
        this.onTouch(evt);
    }

    /**************************************************/
    onResponderMove(evt) {
        this.onTouch(evt);
    }

    /**************************************************/
    onResponderRelease(evt, gs) {
        // let strokes = this.state.previousStrokes;
        if (this.props.actionType === 'text') {
            flag = 1;
        } else {
            flag = 0;
        }
        if (!this.props.moveAble) {
            if (this.state.currentPoints.length < 1) {
                return;
            }

            if (!this.props.drawActive) {
                return;
            }
            // if (this.props.actionType !== '') {
            //     this.setState({
            //         endTouchX: Math.trunc(evt.nativeEvent.locationX),
            //         endTouchY: Math.trunc(evt.nativeEvent.locationY),
            //     });
            //     // this.forceUpdate();
            // }
            let points = this.currentPoints || this.state.currentPoints;
            if (points.length === 1) {
                let p = points[0];
                let distance = parseInt(Math.sqrt((this.props.strokeWidth || 4)) / 2, 10);
                points.push(new Point(p.x + distance, p.y + distance, p.time));
            }
            let newElement
            if (this.props.actionType === '') {
                newElement = {
                    type: 'Path',
                    attributes: {
                        d: this.state.pen.pointsToSvg(points, this.props.simplifyTolerance, this.props.lineGenerator),
                        stroke: (this.props.color || '#000000'),
                        strokeWidth: (this.props.strokeWidth || 4),
                        fill: "none",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                    },
                };
            } else if (this.props.actionType === 'arrows') {
                newElement = {
                    type: 'Arrows',
                    attributes: {
                        startTouchX: this.state.startTouchX,
                        startTouchY: this.state.startTouchY,
                        endTouchX: this.state.endTouchX,
                        endTouchY: this.state.endTouchY,
                    },
                };
            } else if (this.props.actionType === 'multiArrows') {
                newElement = {
                    type: 'MultiArrows',
                    attributes: {
                        startTouchX: this.state.startTouchX,
                        startTouchY: this.state.startTouchY,
                        endTouchX: this.state.endTouchX,
                        endTouchY: this.state.endTouchY,
                    },
                };
            } else if (this.props.actionType === 'circle') {
                newElement = {
                    type: 'Circle',
                    attributes: {
                        startTouchX: this.state.startTouchX,
                        startTouchY: this.state.startTouchY,
                        endTouchX: this.state.endTouchX,
                        endTouchY: this.state.endTouchY,
                    },
                };
            } else if (this.props.actionType === 'rectangle') {
                newElement = {
                    type: 'Rectangle',
                    attributes: {
                        startTouchX: this.state.startTouchX,
                        startTouchY: this.state.startTouchY,
                        endTouchX: this.state.endTouchX,
                        endTouchY: this.state.endTouchY,
                    },
                };
            } else if (this.props.actionType === 'line') {
                newElement = {
                    type: 'Line',
                    attributes: {
                        startTouchX: this.state.startTouchX,
                        startTouchY: this.state.startTouchY,
                        endTouchX: this.state.endTouchX,
                        endTouchY: this.state.endTouchY,
                    },
                };
            }

            this.state.pen.addStroke(points);

            this.currentPoints = [];
            if (this.props.actionType !== 'text') {
                InteractionManager.runAfterInteractions(() => {
                    this.setState({
                        previousStrokes: [...this.state.previousStrokes, newElement],
                        currentPoints: this.currentPoints || [],
                    }, () => {
                        requestAnimationFrame(() => {
                            this._onChangeStrokes(this.state.previousStrokes);
                        });
                    });
                });
            }
        } else {
            if (this.state.index !== null) {
                this.setState({
                    endTouchX: Math.trunc(evt.nativeEvent.locationX),
                    endTouchY: Math.trunc(evt.nativeEvent.locationY),
                }, () => {
                    let moveX = this.state.endTouchX - this.state.startTouchX;
                    let moveY = this.state.endTouchY - this.state.startTouchY;
                    let newArray = [...this.state.previousStrokes];
                    if (newArray[this.state.index].type !== 'Text') {
                        newArray[this.state.index] = {
                            ...newArray[this.state.index],
                            attributes: {
                                startTouchX: newArray[this.state.index].attributes.startTouchX + moveX,
                                startTouchY: newArray[this.state.index].attributes.startTouchY + moveY,
                                endTouchX: newArray[this.state.index].attributes.endTouchX + moveX,
                                endTouchY: newArray[this.state.index].attributes.endTouchY + moveY
                            }
                        }
                    } else {
                        newArray[this.state.index] = {
                            ...newArray[this.state.index],
                            attributes: {
                                text: newArray[this.state.index].attributes.text,
                                startTouchX: newArray[this.state.index].attributes.startTouchX + moveX,
                                startTouchY: newArray[this.state.index].attributes.startTouchY + moveY,
                            }
                        }
                    }
                    this.setState({
                        previousStrokes: newArray,
                    });
                });
            }
        }
    }

    /****************************************************************************************************/
    _onChangeStrokes = (strokes) => {
        if (this.props.onChangeStrokes) {
            requestAnimationFrame(() => {
                this.props.onChangeStrokes(strokes);
            });
        }
    }
    /**************************************************/
    _onLayoutContainer = (e) => {
        this.state.pen.setOffset(e.nativeEvent.layout);
        this._layout = e.nativeEvent.layout;
    }
    /****************************************************************************************************/
    _renderSvgElement = (e, tracker) => {
        if (e.type === 'Path') {
            return <Path {...e.attributes} key={tracker}/>;
        }

        return null;
    }

    outsideInput = () => {
        // alert('clicked')
        Keyboard.dismiss();
        let newElement = {
            type: 'Text',
            attributes: {
                text: this.state.text,
                startTouchX: this.state.startTouchX,
                startTouchY: this.state.startTouchY,
            },
        };
        if (this.state.text !== '') {
            InteractionManager.runAfterInteractions(() => {
                this.setState({
                    previousStrokes: [...this.state.previousStrokes, newElement],
                    currentPoints: this.currentPoints || [],
                }, () => {
                    requestAnimationFrame(() => {
                        this._onChangeStrokes(this.state.previousStrokes);
                    });
                });
            });
        }
        this.props.handleEditText();
    }
    updateElement = (index) => {
        this.setState({index});
        this.forceUpdate();
    }

    /**************************************************/
    render() {
        const {previousStrokes = []} = this.state;
        return (
            <Box
                onLayout={this._onLayoutContainer}
                style={[
                    styles.drawContainer,
                    this.props.containerStyle,
                ]}>
                <Box f={1} w={width} my={STATUS_BAR_HEIGHT + 20} {...this._panResponder.panHandlers}>
                    {this.props.actionType === 'text' ?
                        <Box f={1}>
                            <Box f={0.145} w={'100%'} dir={'row'} style={styles.checkIcon} position={'absolute'}
                                 left={0} right={0} top={-10} mt={'sm'}>
                                <Box f={1}/>
                                <Box f={1} style={{justifyContent: 'flex-end'}} dir={'row'} w={theme.space["2xl"]}
                                     h={theme.space["2xl"]}>
                                    <TouchableOpacity style={{
                                        backgroundColor: '#f1f1f1',
                                        width: '30%',
                                        height: '100%',
                                        justifyContent: "center"
                                    }} onPress={() => this.outsideInput()}>
                                        <Icon name={'check'} type={"font-awesome-5"}
                                              color={this.props.color}
                                              size={24}/>
                                    </TouchableOpacity>
                                </Box>
                            </Box>
                            <TextInput
                                multiline={true}
                                autoFocus={true}
                                onChangeText={(value) => this.setState({text: value})}
                                style={{
                                    backgroundColor: '#fff',
                                    borderColor: '#000',
                                    color: this.props.color,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    position: 'absolute',
                                    textAlignVertical: 'top',
                                    top: Math.abs(this.state.startTouchY),
                                    left: Math.abs(this.state.startTouchX),
                                    width: Math.abs(this.state.endTouchX - this.state.startTouchX),
                                    height: Math.abs(this.state.endTouchY - this.state.startTouchY),
                                }}
                            />
                        </Box>
                        :
                        <Svg f={1}>
                            {previousStrokes.map((stroke, index) => {
                                if (stroke.type === 'Path') {
                                    return this._renderSvgElement(stroke, index);
                                } else if (stroke.type === 'Arrows') {
                                    return (
                                        <Svg>
                                            <G
                                                rotation={(Math.atan2(stroke.attributes.endTouchY - stroke.attributes.startTouchY, stroke.attributes.endTouchX - stroke.attributes.startTouchX) * 180 / Math.PI) - 135}
                                                origin={`${stroke.attributes.endTouchX}, ${stroke.attributes.endTouchY}`}
                                            >
                                                <Path
                                                    d={`M${stroke.attributes.endTouchX + 8} ${stroke.attributes.endTouchY + 8} L${stroke.attributes.endTouchX - 10} ${stroke.attributes.endTouchY + 10} L${stroke.attributes.endTouchX - 8} ${stroke.attributes.endTouchY - 8} z`}
                                                    fill={this.props.color} stroke={this.props.color}/>
                                            </G>

                                            <Line
                                                x1={stroke.attributes.startTouchX}
                                                y1={stroke.attributes.startTouchY}
                                                x2={stroke.attributes.endTouchX}
                                                y2={stroke.attributes.endTouchY}
                                                stroke={this.props.color}
                                                strokeWidth="10"
                                                onPress={() => this.updateElement(index)}
                                            />
                                        </Svg>
                                    )
                                } else if (stroke.type === 'Line') {
                                    return (
                                        <Svg>
                                            <Line
                                                x1={stroke.attributes.startTouchX}
                                                y1={stroke.attributes.startTouchY}
                                                x2={stroke.attributes.endTouchX}
                                                y2={stroke.attributes.endTouchY}
                                                stroke={this.props.color}
                                                strokeWidth="10"
                                                onPress={() => this.updateElement(index)}
                                            />
                                        </Svg>
                                    )
                                } else if (stroke.type === 'MultiArrows') {
                                    return (
                                        <Svg>
                                            <G
                                                rotation={(Math.atan2(stroke.attributes.endTouchY - stroke.attributes.startTouchY, stroke.attributes.endTouchX - stroke.attributes.startTouchX) * 180 / Math.PI) + 45}
                                                origin={`${stroke.attributes.startTouchX}, ${stroke.attributes.startTouchY}`}
                                            >
                                                <Path
                                                    d={`M ${stroke.attributes.startTouchX + 8} ${stroke.attributes.startTouchY + 8} L ${stroke.attributes.startTouchX - 10} ${stroke.attributes.startTouchY + 10} L ${stroke.attributes.startTouchX - 8} ${stroke.attributes.startTouchY - 8} z`}
                                                    fill={this.props.color} stroke={this.props.color}/>
                                            </G>
                                            <G
                                                rotation={(Math.atan2(stroke.attributes.endTouchY - stroke.attributes.startTouchY, stroke.attributes.endTouchX - stroke.attributes.startTouchX) * 180 / Math.PI) - 135}
                                                origin={`${stroke.attributes.endTouchX}, ${stroke.attributes.endTouchY}`}
                                            >
                                                <Path
                                                    d={`M${stroke.attributes.endTouchX + 8} ${stroke.attributes.endTouchY + 8} L${stroke.attributes.endTouchX - 10} ${stroke.attributes.endTouchY + 10} L${stroke.attributes.endTouchX - 8} ${stroke.attributes.endTouchY - 8} z`}
                                                    fill={this.props.color} stroke={this.props.color}/>
                                            </G>

                                            <Line
                                                x1={stroke.attributes.startTouchX}
                                                y1={stroke.attributes.startTouchY}
                                                x2={stroke.attributes.endTouchX}
                                                y2={stroke.attributes.endTouchY}
                                                stroke={this.props.color}
                                                strokeWidth="10"
                                                onPress={() => this.updateElement(index)}
                                            />
                                        </Svg>
                                    )
                                } else if (stroke.type === 'Text') {
                                    return (
                                        <Text
                                            x={Math.abs(stroke.attributes.startTouchX)}
                                            y={Math.abs(stroke.attributes.startTouchY)}
                                            onPress={() => this.updateElement(index)}
                                            fontWeight="bold"
                                            fontSize="18"
                                            fill={this.props.color}
                                            textAnchor="start"
                                        >
                                            {stroke.attributes.text}
                                        </Text>
                                    )
                                } else if (stroke.type === 'Circle') {
                                    return (
                                        <Svg>
                                            <Ellipse
                                                cx={stroke.attributes.startTouchX}
                                                cy={stroke.attributes.startTouchY}
                                                rx={Math.abs(stroke.attributes.endTouchX - stroke.attributes.startTouchX)}
                                                ry={Math.abs(stroke.attributes.endTouchY - stroke.attributes.startTouchY)}
                                                stroke={this.props.color}
                                                strokeWidth="3"
                                                onPress={() => this.updateElement(index)}
                                            />
                                        </Svg>
                                    )
                                } else if (stroke.type === 'Rectangle') {
                                    return (
                                        <Svg>
                                            <Rect
                                                x={stroke.attributes.startTouchX}
                                                y={stroke.attributes.startTouchY}
                                                width={Math.abs(stroke.attributes.endTouchX - stroke.attributes.startTouchX)}
                                                height={Math.abs(stroke.attributes.endTouchY - stroke.attributes.startTouchY)}
                                                stroke={this.props.color}
                                                strokeWidth="3"
                                                onPress={() => this.updateElement(index)}
                                            />
                                        </Svg>
                                    )
                                }
                            })}
                            {this.props.actionType === 'arrows' ?
                                <>
                                    <G
                                        rotation={(Math.atan2(this.state.endTouchY - this.state.startTouchY, this.state.endTouchX - this.state.startTouchX) * 180 / Math.PI) - 135}
                                        origin={`${this.state.endTouchX}, ${this.state.endTouchY}`}
                                    >
                                        <Path
                                            d={`M${this.state.endTouchX + 8} ${this.state.endTouchY + 8} L${this.state.endTouchX - 10} ${this.state.endTouchY + 10} L${this.state.endTouchX - 8} ${this.state.endTouchY - 8} z`}
                                            fill={this.props.color} stroke={this.props.color}/>
                                    </G>

                                    <Line
                                        x1={this.state.startTouchX}
                                        y1={this.state.startTouchY}
                                        x2={this.state.endTouchX}
                                        y2={this.state.endTouchY}
                                        stroke={this.props.color}
                                        strokeWidth="10"
                                    />
                                </>
                                :
                                <>
                                    {this.props.actionType === 'multiArrows' ?
                                        <>
                                            <G
                                                rotation={(Math.atan2(this.state.endTouchY - this.state.startTouchY, this.state.endTouchX - this.state.startTouchX) * 180 / Math.PI) + 45}
                                                origin={`${this.state.startTouchX}, ${this.state.startTouchY}`}
                                            >
                                                <Path
                                                    d={`M ${this.state.startTouchX + 8} ${this.state.startTouchY + 8} L ${this.state.startTouchX - 10} ${this.state.startTouchY + 10} L ${this.state.startTouchX - 8} ${this.state.startTouchY - 8} z`}
                                                    fill={this.props.color} stroke={this.props.color}/>
                                            </G>
                                            <G
                                                rotation={(Math.atan2(this.state.endTouchY - this.state.startTouchY, this.state.endTouchX - this.state.startTouchX) * 180 / Math.PI) - 135}
                                                origin={`${this.state.endTouchX}, ${this.state.endTouchY}`}
                                            >
                                                <Path
                                                    d={`M${this.state.endTouchX + 8} ${this.state.endTouchY + 8} L${this.state.endTouchX - 10} ${this.state.endTouchY + 10} L${this.state.endTouchX - 8} ${this.state.endTouchY - 8} z`}
                                                    fill={this.props.color} stroke={this.props.color}/>
                                            </G>

                                            <Line
                                                x1={this.state.startTouchX}
                                                y1={this.state.startTouchY}
                                                x2={this.state.endTouchX}
                                                y2={this.state.endTouchY}
                                                stroke={this.props.color}
                                                strokeWidth="10"
                                            />
                                        </>
                                        :
                                        <>
                                            {this.props.actionType === 'circle' ?
                                                <Ellipse
                                                    cx={this.state.startTouchX}
                                                    cy={this.state.startTouchY}
                                                    rx={Math.abs(this.state.endTouchX - this.state.startTouchX)}
                                                    ry={Math.abs(this.state.endTouchY - this.state.startTouchY)}
                                                    stroke={this.props.color}
                                                    strokeWidth="3"
                                                />
                                                :
                                                <>
                                                    {this.props.actionType === 'rectangle' ?
                                                        <Rect
                                                            x={this.state.startTouchX}
                                                            y={this.state.startTouchY}
                                                            width={Math.abs(this.state.endTouchX - this.state.startTouchX)}
                                                            height={Math.abs(this.state.endTouchY - this.state.startTouchY)}
                                                            stroke={this.props.color}
                                                            strokeWidth="3"
                                                        />
                                                        :
                                                        <>
                                                            {this.props.actionType === 'line' ?
                                                                <Line
                                                                    x1={this.state.startTouchX}
                                                                    y1={this.state.startTouchY}
                                                                    x2={this.state.endTouchX}
                                                                    y2={this.state.endTouchY}
                                                                    stroke={this.props.color}
                                                                    strokeWidth="10"
                                                                />
                                                                :
                                                                <G>
                                                                    <Path
                                                                        key={previousStrokes.length}
                                                                        fillOpacity={this.props.editOpacity || 0.7}
                                                                        strokeOpacity={this.props.editOpacity || 0.7}
                                                                        d={this.state.pen.pointsToSvg(this.state.currentPoints, this.props.simplifyTolerance, this.props.lineGenerator, false)}
                                                                        stroke={this.props.color || "#000000"}
                                                                        strokeWidth={this.props.strokeWidth || 4}
                                                                        fill="none"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </G>
                                                            }
                                                        </>
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                        </Svg>
                    }
                    <AwesomeAlert
                        show={this.state.showAlert}
                        showProgress={false}
                        title={this.state.alertTitle}
                        message={this.state.alertMessage}
                        closeOnTouchOutside={false}
                        closeOnHardwareBackPress={false}
                        showCancelButton={true}
                        showConfirmButton={true}
                        cancelText='No, cancel'
                        confirmText='Yes'
                        confirmButtonColor={theme.color.redDark}
                        onConfirmPressed={() => {
                            this.setState({showAlert: false});
                        }}
                        onCancelPressed={() => {
                            this.setState({showAlert: false});
                        }}
                    />
                    {this.props.children}
                </Box>
            </Box>
        );
    }

    /****************************************************************************************************/
}
