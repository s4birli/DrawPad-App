import React, {Component} from 'react'
import {Box, Text} from 'react-native-design-utility';
import {
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {Icon} from 'react-native-elements';
import DatePicker from 'react-native-datepicker'
import Modal from 'react-native-modalbox';
import * as ImagePicker from 'expo-image-picker';
import {Checkbox} from "galio-framework";
import AwesomeAlert from "react-native-awesome-alerts";
import {inject} from "mobx-react";
import * as Permissions from "expo-permissions";
import Slider from "react-native-slider";
import {captureRef as takeSnapshotAsync} from "react-native-view-shot";
import {Ionicons} from '@expo/vector-icons';
import {MaterialIcons} from "@expo/vector-icons";
import {FontAwesome5} from '@expo/vector-icons';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {Entypo} from '@expo/vector-icons';
import {ColorPicker, fromHsv} from "react-native-color-picker";
import DropDownPicker from 'react-native-dropdown-picker';
import MultiSelect from "react-native-multiple-select";

import theme from '../../constants/theme';
import UserInput from '../../shared/UserInput';
import strings from '../../constants/strings';
import Loader from "../../components/Loader";
import {BaseApi} from "../../api/api";
import {DrawPad} from "../../components/rn-draw";

const {width, height} = Dimensions.get('window');
const AnimatedBox = Animated.createAnimatedComponent(Box);

@inject("currentUser")
class NewProcedureScreen extends Component {

    CURRENT_USER = this.props.currentUser
    PARAMS = this.props.navigation.state.params
    state = {
        imageType: '',
        alertTitle: "",
        alertMessage: "",

        loading: false,
        showAlert: false,
        showSuccessButton: false,
        showCancelButton: false,

        procedure_id: '',
        company_logo_uri: '',
        company_logo_file_name: '',
        company_logo_type: '',
        company_name_and_address: '',
        equipment_name_and_description: '',
        asset_number: '',
        building_name: '',
        department_and_author: '',

        cautionsToSend: [],

        allCautions: [],

        deviceCounter: '6',

        devicesToSend: [],
        devicesToShow: [],

        selectedDeviceName: '',
        selectedDeviceCheck: '',
        selectedDeviceMethod: '',
        selectedDeviceLocation: '',
        selectedDeviceSource: '',
        selectedDeviceID: '',

        selectedDeviceNameToShow: '',
        selectedDeviceCheckToShow: '',
        selectedDeviceMethodToShow: '',
        selectedDeviceSourceToShow: '',
        selectedDeviceIDToShow: '',

        deviceNames: [],
        deviceChecks: [],
        deviceMethods: [],
        deviceSources: [],
        deviceIDs: [],

        rev_date: new Date(),
        origin_date: new Date(),
        photo1_uri: '',
        photo1_file_name: '',
        photo1_type: '',
        photo2_uri: '',
        photo2_file_name: '',
        photo2_type: '',
        photo3_uri: '',
        photo3_file_name: '',
        photo3_type: '',
        lock_and_tags_needed: '0',
        email_to_send_on: '',
        create_pdf: false,

        isDrawActive: true,
        isOptionsActive: false,

        selectedColor: '#84c300',
        strokeColor: '#84c300',
        strokeWidth: 15,

        strokesCount: 0,
        mediaUri: null,
        editableText: false,
        actionType: '',
        actionColor: '',
        moveAble: false,
    }

    constructor(props) {
        super(props);
    }

    static navigationOptions = ({navigation}) => {
        return {
            title: navigation.getParam('title', 'New Procedure'),
            headerStyle: {
                backgroundColor: theme.color.greenLight,
            },
            headerTintColor: theme.color.white,
            headerTitleStyle: {
                fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
        };
    };

    componentWillUnmount() {
        this._drawRef = null;
        this._editorRef = null;

    }

    componentDidMount() {
        this.askPermissions().then()
        this.getProcedureDevices().then()
        this.PARAMS.from === 'saved' && this.fill_out_procedure(this.PARAMS.procedure).then()

        // this.refs.drawModal.open()
    }

    actionPictureSelect = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Image,
        });

        if (!result.cancelled) {
            this.setState({
                mediaUri: result.uri,
            });
        }
    }

    fill_out_procedure = async (procedure) => {
        this.setState({loading: true});
        const company_logo_uri = procedure.company_logo ? strings.BASE_URL + '/' + procedure.company_logo.replace('public', 'storage') : 'old'
        const photo1_uri = procedure.photos[0] ? strings.BASE_URL + '/' + procedure.photos[0].replace('public', 'storage') : 'old'
        const photo2_uri = procedure.photos[1] ? strings.BASE_URL + '/' + procedure.photos[1].replace('public', 'storage') : 'old'
        const photo3_uri = procedure.photos[2] ? strings.BASE_URL + '/' + procedure.photos[2].replace('public', 'storage') : 'old'
        let _devicesToShow = []
        let _devicesToSend = []
        procedure.devices.map((data) => {
            _devicesToShow.push({
                id: data.device_id.device_id ?? '',
                method: data.method.method ?? '',
                check: data.check.check ?? '',
                location: data.device_location ?? '',
                name: data.name.name ?? '',
                source: data.source.source ?? ''
            })
            _devicesToSend.push({
                id: data.device_id_id ?? '',
                method: data.device_method_id ?? '',
                check: data.device_check_id ?? '',
                location: data.device_location ?? '',
                name: data.device_name_id ?? '',
                source: data.device_source_id ?? ''
            })
        })
        let _cautionsToSend = []
        procedure.cautions.map((data) => {
            _cautionsToSend.push(data['pivot']['procedure_caution_id'])
        })

        await this.setState({
            procedure_id: procedure.id,
            company_logo_uri: company_logo_uri,
            company_name_and_address: procedure.company_name_and_address,
            equipment_name_and_description: procedure.equipment_name_and_description,
            asset_number: procedure.asset_number,
            building_name: procedure.building_name,
            department_and_author: procedure.department_and_author,
            cautionsToSend: _cautionsToSend,
            rev_date: procedure.rev_date,
            origin_date: procedure.origin_date,
            photo1_uri: photo1_uri,
            photo2_uri: photo2_uri,
            photo3_uri: photo3_uri,
            devicesToShow: _devicesToShow,
            devicesToSend: _devicesToSend,
            lock_and_tags_needed: procedure.lock_and_tags_needed,
            deviceCounter: procedure.lock_and_tags_needed,
            email_to_send_on: procedure.email_to_send_on,
        });

        this.setState({loading: false});
    }

    async askPermissions() {
        if (Platform.OS !== 'web') {
            const permission = await Permissions.askAsync(
                Permissions.CAMERA,
                Permissions.CAMERA_ROLL
            );

            if (permission.status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
            }
        }
    }

    getName = (uri) => {
        return uri.split('/').pop()
    }
    getType = (uri) => {
        return 'image/' + uri.split('/').pop().split('.').pop()
    }
    pickImage = async (type, from, mode = null) => {
        this.refs.pickImageModal.close()
        if (mode && mode === 'clear') {
            switch (type) {
                case 'logo':
                    this.setState({
                        company_logo_uri: '',
                        company_logo_file_name: '',
                        company_logo_type: ''
                    })
                    break;
                case 'photo1':
                    this.setState({
                        photo1_uri: '',
                        photo1_file_name: '',
                        photo1_type: ''
                    })
                    break;
                case 'photo2':
                    this.setState({
                        photo2_uri: '',
                        photo2_file_name: '',
                        photo2_type: ''
                    })
                    break;
                case 'photo3':
                    this.setState({
                        photo3_uri: '',
                        photo3_file_name: '',
                        photo3_type: ''
                    })
                    break;
            }
        } else {
            let result;
            from === 'camera' && (result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                aspect: [16, 9],
                quality: 1,
            }));
            from === 'gallery' && (result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                aspect: [4, 3],
                quality: 1,
            }));
            if (!result.cancelled) {
                let file_uri = result.uri
                let file_name = this.getName(file_uri)
                let file_type = this.getType(file_uri)
                switch (type) {
                    case 'logo':
                        this.setState({
                            company_logo_uri: file_uri,
                            company_logo_file_name: file_name,
                            company_logo_type: file_type
                        })
                        break;
                    case 'photo1':
                        this.setState({
                            photo1_uri: file_uri,
                            photo1_file_name: file_name,
                            photo1_type: file_type
                        })
                        break;
                    case 'photo2':
                        this.setState({
                            photo2_uri: file_uri,
                            photo2_file_name: file_name,
                            photo2_type: file_type
                        })
                        break;
                    case 'photo3':
                        this.setState({
                            photo3_uri: file_uri,
                            photo3_file_name: file_name,
                            photo3_type: file_type
                        })
                        break;
                }
            }
        }
    };

    getProcedureDevices = async () => {
        this.setState({loading: true})
        const result = await BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/procedure-devices')
            .get().json()

        console.log(result.message)

        if (result.status === 200) {
            const _devices = result.data.devices
            const _cautions = result.data.cautions
            await this.setState({
                allCautions: _cautions,
            })
            // await this.setting_cautions(_cautions).then()
            await this.setting_devices(_devices.devices_ids, _devices.devices_sources, _devices.devices_methods,
                _devices.devices_checks, _devices.devices_names,).then()

            this.setState({loading: false})
        }
    }
    setting_devices = async (IDs, sources, methods, checks, names) => {
        let _deviceIDs = []
        let _deviceSources = []
        let _deviceMethods = []
        let _deviceChecks = []
        let _deviceNames = []

        IDs.map((data, i) => {
            _deviceIDs.push({
                label: data.device_id,
                value: data.id
            })
        })
        sources.map((data, i) => {
            _deviceSources.push({
                label: data.source,
                value: data.id
            })
        })
        methods.map((data, i) => {
            _deviceMethods.push({
                label: data.method,
                value: data.id
            })
        })
        checks.map((data, i) => {
            _deviceChecks.push({
                label: data.check,
                value: data.id
            })
        })
        names.map((data, i) => {
            _deviceNames.push({
                label: data.name,
                value: data.id
            })
        })
        await this.setState({
            deviceIDs: _deviceIDs,
            deviceSources: _deviceSources,
            deviceMethods: _deviceMethods,
            deviceChecks: _deviceChecks,
            deviceNames: _deviceNames,
        })
    }

    async appendDevices() {
        if (
            !this.state.selectedDeviceID ||
            !this.state.selectedDeviceSource ||
            !this.state.selectedDeviceLocation ||
            !this.state.selectedDeviceMethod ||
            !this.state.selectedDeviceCheck ||
            !this.state.selectedDeviceName
        ) {
            this.show_alert(true, true, false, "Error in input", strings.all_empty);
            return;
        }

        if (this.state.lock_and_tags_needed >= 6)
            return

        await this.setState({
            lock_and_tags_needed: (parseInt(this.state.lock_and_tags_needed) + 1).toString(),
        })
        let _devicesToShowObj = {
            id: this.state.selectedDeviceIDToShow,
            source: this.state.selectedDeviceSourceToShow,
            location: this.state.selectedDeviceLocation,
            method: this.state.selectedDeviceMethodToShow,
            check: this.state.selectedDeviceCheckToShow,
            name: this.state.selectedDeviceNameToShow
        }
        let _devicesToSendObj = {
            id: this.state.selectedDeviceID,
            source: this.state.selectedDeviceSource,
            location: this.state.selectedDeviceLocation,
            method: this.state.selectedDeviceMethod,
            check: this.state.selectedDeviceCheck,
            name: this.state.selectedDeviceName
        }

        let _devicesToShow = this.state.devicesToShow
        let _devicesToSend = this.state.devicesToSend

        _devicesToShow.push(_devicesToShowObj)
        _devicesToSend.push(_devicesToSendObj)

        await this.setState({
            devicesToShow: _devicesToShow,
            devicesToSend: _devicesToSend,
        });

        this.refs.deviceInfoModal.close()
    }

    async deleteDevice(id) {
        await this.setState({
            lock_and_tags_needed: (parseInt(this.state.lock_and_tags_needed) - 1).toString()
        })
        let _devicesToShow = this.state.devicesToShow
        let _devicesToSend = this.state.devicesToSend
        _devicesToShow.forEach(function (data, index) {
            if (id === data.id) {
                _devicesToShow.splice(index, 1);
                _devicesToSend.splice(index, 1);
            }
        })
        await this.setState({
            devicesToShow: _devicesToShow,
            devicesToSend: _devicesToSend
        });
    }

    show_alert = (show = true, show_error = true, show_success = false, title, message) => {
        this.setState({showAlert: show});
        this.setState({showCancelButton: show_error});
        this.setState({showSuccessButton: show_success});
        this.setState({alertTitle: title});
        this.setState({alertMessage: message});
    };

    CREATE = async () => {
        if (this.state.company_name_and_address && this.state.company_name_and_address.length > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Company Name and Address Error.",
                'Company Name and Address must be at most 255 characters long.'
            );
            return;
        }
        if (this.state.equipment_name_and_description && this.state.equipment_name_and_description.length > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Equipment Name and Description Error.",
                'Equipment Name and Description must be at most 255 characters long.'
            );
            return;
        }
        if (this.state.asset_number && this.state.asset_number.length > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Asset Number Error.",
                'Asset Number must be at most 255 characters long.'
            );
            return;
        }
        if (this.state.building_name && this.state.building_name > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Building Name Error.",
                'Building Name must be at most 255 characters long.'
            );
            return;
        }
        if (this.state.department_and_author && this.state.department_and_author.length > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Department and Author Error.",
                'Department and Author must be at most 255 characters long.'
            );
            return;
        }
        if (this.state.cautions && this.state.cautions.length > 255) {
            this.show_alert(
                true,
                true,
                false,
                "Cautions Error.",
                'Cautions must be at most 255 characters long.'
            );
            return;
        }

        this.setState({loading: true});

        console.log([
            this.state.create_pdf
        ])

        if (this.CURRENT_USER.info.procedures_count <= 0) {
            this.show_alert(
                true,
                true,
                false,
                "Application Error.",
                'You have left with ZERO number of procedures, consider buying our paid plans or contact your administrator to allot you number of procedures.'
            );
            return;
        }
        const _data = {
            company_logo_uri: this.state.company_logo_uri,
            company_logo_file_name: this.state.company_logo_file_name,
            company_logo_type: this.state.company_logo_type,
            company_logo_check: this.state.company_logo_file_name ? 'new' : this.state.company_logo_uri ? 'old' : 'clear',

            company_name_and_address: this.state.company_name_and_address,
            equipment_name_and_description: this.state.equipment_name_and_description,
            asset_number: this.state.asset_number,
            building_name: this.state.building_name,
            department_and_author: this.state.department_and_author,
            cautions: this.state.cautionsToSend,
            rev_date: this.state.rev_date,
            origin_date: this.state.origin_date,

            photo1_uri: this.state.photo1_uri,
            photo1_file_name: this.state.photo1_file_name,
            photo1_type: this.state.photo1_type,
            photo1_check: this.state.photo1_file_name ? 'new' : this.state.photo1_uri ? 'old' : 'clear',

            photo2_uri: this.state.photo2_uri,
            photo2_file_name: this.state.photo2_file_name,
            photo2_type: this.state.photo2_type,
            photo2_check: this.state.photo2_file_name ? 'new' : this.state.photo2_uri ? 'old' : 'clear',

            photo3_uri: this.state.photo3_uri,
            photo3_file_name: this.state.photo3_file_name,
            photo3_type: this.state.photo3_type,
            photo3_check: this.state.photo3_file_name ? 'new' : this.state.photo3_uri ? 'old' : 'clear',

            devices: this.state.devicesToSend,
            lock_and_tags_needed: this.state.lock_and_tags_needed,
            email_to_send_on: this.state.email_to_send_on,
            create_pdf: this.state.create_pdf,
        }
        try {
            const result = this.PARAMS.from === 'new' ?
                await this.CURRENT_USER.create_procedure(_data)
                :
                await this.CURRENT_USER.create_procedure_from_template(this.state.procedure_id, _data);

            console.log('creating procedure result is', result.message);

            if (result.status === 200) {
                this.PARAMS.from === 'new' ? this.clear_fields().then() : await this.fill_out_procedure(result.data.procedure)
                this.setState({loading: false});
                let _title = this.PARAMS.from === 'new' ? 'New Procedure Created' : 'New Procedure from template'
                this.show_alert(true, false, true, _title, result.message);
            } else {
                this.setState({loading: false});
                let res = JSON.parse(result)
                let errors = res.data
                let items = Object.keys(errors);
                let value = ''
                items.map(key => {
                    value = '- ' + errors[key][0] + '\n' + value
                });
                console.log('errors: ', value);
                this.show_alert(
                    true,
                    true,
                    false,
                    '' + res.message,
                    '' + value
                );
            }
            this.setState({loading: false});
        } catch (e) {
            this.setState({loading: false});
            console.log(e)
        }
    }

    saveSnapshot = async (type) => {
        if (!this._editorRef) {
            return;
        }
        const signatureResult = await takeSnapshotAsync(this._editorRef, {
            result: 'tmpfile',
            quality: 1,
            format: 'png',
        });
        if (!signatureResult) {
            alert('Can\'t snapshot!');
            return;
        }

        let snapshotUri = signatureResult
        let snapshotName = this.getName(signatureResult)
        let snapshotType = this.getType(signatureResult)

        switch (type) {
            case 'logo':
                this.setState({
                    company_logo_uri: snapshotUri,
                    company_logo_file_name: snapshotName,
                    company_logo_type: snapshotType
                })
                break;
            case 'photo1':
                this.setState({
                    photo1_uri: snapshotUri,
                    photo1_file_name: snapshotName,
                    photo1_type: snapshotType
                })
                break;
            case 'photo2':
                this.setState({
                    photo2_uri: snapshotUri,
                    photo2_file_name: snapshotName,
                    photo2_type: snapshotType
                })
                break;
            case 'photo3':
                this.setState({
                    photo3_uri: snapshotUri,
                    photo3_file_name: snapshotName,
                    photo3_type: snapshotType
                })
                break;
        }

        this.refs.drawModal.close()
    }

    actionOptionsToggleActive = () => this.setState({isOptionsActive: !this.state.isOptionsActive});
    actionDrawerToggleActive = () => this.setState({isDrawActive: !this.state.isDrawActive});
    actionDrawerRewind = () => {
        if (!this._drawRef) {
            return;
        }

        this._drawRef.rewind();
    }
    actionDrawerClear = () => {
        if (!this._drawRef) {
            return;
        }

        this._drawRef.clear();
    }

    moveAble = () => {
        console.log('in moveAble')
        this.setState(prevState => ({moveAble: !prevState.moveAble}));
    }

    arrowsActive = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected arrow')
            this.setState({actionType: 'arrows', moveAble: false})
        }
    }

    lineActive = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected line')
            this.setState({actionType: 'line', moveAble: false})
        }
    }

    multiArrowsActive = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected multiArrow')
            this.setState({actionType: 'multiArrows', moveAble: false})
        }
    }

    actionEditableText = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected editableText')
            this.setState({actionType: 'text', moveAble: false})
        }
    }

    actionCircle = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected circle')
            this.setState({actionType: 'circle', moveAble: false})
        }
    }

    actionRectangle = () => {
        if (this.state.actionType) {
            console.log('deselected ' + this.state.actionType)
            this.setState({actionType: ''})
        } else {
            console.log('selected rectangle')
            this.setState({actionType: 'rectangle', moveAble: false})
        }
    }

    renderTopBar() {
        return (
            <Box style={styles.topBar}>
                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    {(this.state.strokesCount > 0) &&
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionDrawerClear}>
                        <Icon name={'eraser'} type={"font-awesome-5"} color={theme.color.redLight} size={22}/>
                    </TouchableOpacity>}
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.lineActive}>
                        <FontAwesome5 name="slash" size={22}
                                      color={this.state.actionType === 'line' ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.arrowsActive}>
                        <MaterialCommunityIcons name="arrow-bottom-right" size={24}
                                                color={this.state.actionType === 'arrows' ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.multiArrowsActive}>
                        <MaterialCommunityIcons name="arrow-top-left-bottom-right" size={22}
                                                color={this.state.actionType === 'multiArrows' ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionEditableText}>
                        <Box
                            style={{
                                height: 28,
                                width: 28,
                                borderRadius: 14,
                                backgroundColor: this.state.actionType === 'text' ? this.state.selectedColor : theme.color.greenLight,
                                color: '#fff',
                                borderWidth: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                alignSelf: 'center',
                                borderColor: '#fff',
                            }}>
                            <Text style={{fontSize: 20, color: '#fff', fontWeight: 'bold'}}>
                                A
                            </Text>
                        </Box>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionCircle}>
                        <Entypo name="circle" size={22}
                                color={this.state.actionType === 'circle' ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionRectangle}>
                        <MaterialCommunityIcons name="rectangle-outline" size={26}
                                                color={this.state.actionType === 'rectangle' ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-start'}]}>
                    {(this.state.strokesCount > 0) &&
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionDrawerRewind}>
                        <MaterialIcons name="undo" size={22} color={theme.color.greenLight}/>
                    </TouchableOpacity>}
                </Box>

                <Box style={[styles.toggleButton, {alignSelf: 'flex-end'}]}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionOptionsToggleActive}>
                        <Box
                            style={{
                                height: 28,
                                width: 28,
                                borderRadius: 14,
                                backgroundColor: this.state.strokeColor,
                                borderWidth: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                alignSelf: 'center',
                                borderColor: '#fff',
                            }}>
                            <Box
                                style={{
                                    height: this.state.strokeWidth,
                                    width: this.state.strokeWidth,
                                    borderRadius: (this.state.strokeWidth / 2) + 1,
                                    backgroundColor: '#fff',
                                    borderWidth: 1,
                                    borderColor: this.state.strokeColor,
                                }}
                                backgroundColor="#fff"
                            />
                        </Box>
                    </TouchableOpacity>
                </Box>
            </Box>
        );
    }

    renderEditorOptions() {
        const strokeSize = (this.state.strokeWidth < 2) ? 2 : this.state.strokeWidth * 2;
        if (!this.state.isOptionsActive) {
            return <Box/>;
        }

        return (
            <Box
                style={{
                    position: 'absolute',
                    top: 60,
                    right: 2,
                    height: '60%',
                    width: '50%',
                    justifyContent: 'center',
                }}>
                <Slider
                    step={1}
                    minimumValue={1}
                    maximumValue={30}
                    // minimumTrackTintColor="rgba(0, 122, 255)"
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#b7b7b7"
                    animationType="spring"
                    animateTransitions
                    thumbTouchSize={{
                        width: 50,
                        height: 50,
                    }}
                    value={this.state.strokeWidth}
                    trackStyle={{
                        height: 2
                    }}
                    thumbStyle={[styles.thumb, {
                        // backgroundColor: this.state.strokeColor,
                        backgroundColor: '#FFFFFF',
                        width: strokeSize,
                        height: strokeSize,
                        borderRadius: strokeSize / 2,
                    }]}
                    onValueChange={(value) => {
                        this.setState({strokeWidth: value});
                    }}
                />
                <Box style={{flex: 1, flexDirection: 'column'}}>
                    <ColorPicker
                        style={{flex: 1}}
                        color={this.state.selectedColor}
                        onColorSelected={(color) => {
                            this.setState({
                                isOptionsActive: false,
                                selectedColor: color,
                                strokeColor: fromHsv(color),
                            });
                        }}
                        onColorChange={(color) => {
                            this.setState({
                                selectedColor: color,
                                strokeColor: fromHsv(color),
                            });
                        }}
                    />
                </Box>
            </Box>
        );
    }

    renderBottomBar() {
        return (
            <Box f={0.1} w={'100%'} px={'sm'} dir={'row'} style={styles.bottomBar}>

                <Box f={0.8} style={{justifyContent: 'flex-start'}} m={'xs'} dir={'row'}>
                    <TouchableOpacity style={styles.iconShadow} onPress={() => {
                        this.setState({
                            selectedColor: '#387fff',
                            strokeColor: '#387fff',
                            strokeWidth: 4,
                            strokesCount: 0,
                            mediaUri: null,
                            moveAble: false,
                            actionType: ''
                        })
                        this.refs.drawModal.close()
                    }}>
                        <Icon name={'times'} type={"font-awesome-5"} color={theme.color.redLight} size={28}/>
                    </TouchableOpacity>
                </Box>
                <Box f={0.8} style={{justifyContent: 'flex-start'}} m={'xs'} dir={'row'}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionDrawerToggleActive}>
                        <MaterialIcons name={this.state.isDrawActive ? 'lock-open' : 'lock'} size={26}
                                       color={theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>

                <Box f={0.8} style={{justifyContent: 'center'}} m={'xs'} dir={'row'}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.moveAble}>
                        <Ionicons name="md-move" size={28}
                                  color={this.state.moveAble ? this.state.selectedColor : theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>
                <Box f={0.8} style={{justifyContent: 'center'}} m={'xs'} dir={'row'}>
                    <TouchableOpacity style={styles.iconShadow} onPress={this.actionPictureSelect}>
                        <MaterialIcons name="add-a-photo" size={28} color={theme.color.greenLight}/>
                    </TouchableOpacity>
                </Box>
                <Box f={0.8} style={{justifyContent: 'flex-end'}} m={'xs'} dir={'row'}>
                    <TouchableOpacity onPress={() => this.saveSnapshot(this.state.imageType)}>
                        <Icon name={'download'} type={"font-awesome-5"} color={theme.color.greenLight}
                              size={28}/>
                    </TouchableOpacity>
                </Box>
            </Box>
        );
    }

    clear_fields = async () => {
        await this.setState({
            imageType: '',
            alertTitle: "",
            alertMessage: "",

            loading: false,
            showAlert: false,
            showSuccessButton: false,
            showCancelButton: false,

            procedure_id: '',
            company_logo_uri: '',
            company_logo_file_name: '',
            company_logo_type: '',
            company_name_and_address: '',
            equipment_name_and_description: '',
            asset_number: '',
            building_name: '',
            department_and_author: '',

            cautionsToSend: [],

            allCautions: [],

            deviceCounter: '6',

            devicesToSend: [],
            devicesToShow: [],

            selectedDeviceName: '',
            selectedDeviceCheck: '',
            selectedDeviceMethod: '',
            selectedDeviceLocation: '',
            selectedDeviceSource: '',
            selectedDeviceID: '',

            selectedDeviceNameToShow: '',
            selectedDeviceCheckToShow: '',
            selectedDeviceMethodToShow: '',
            selectedDeviceSourceToShow: '',
            selectedDeviceIDToShow: '',

            deviceNames: [],
            deviceChecks: [],
            deviceMethods: [],
            deviceSources: [],
            deviceIDs: [],

            rev_date: new Date(),
            origin_date: new Date(),
            photo1_uri: '',
            photo1_file_name: '',
            photo1_type: '',
            photo2_uri: '',
            photo2_file_name: '',
            photo2_type: '',
            photo3_uri: '',
            photo3_file_name: '',
            photo3_type: '',
            lock_and_tags_needed: '0',
            email_to_send_on: '',
            create_pdf: false,

            selectedColor: '#000',
            strokeWidth: 4,
            tracker: 0,
            currentPoints: [],
            previousStrokes: [],
            newStroke: []
        });
    }

    render() {
        return (
            <Box mt={Platform.OS === 'ios' ? 10 : 0} f={1} p={'xs'}>
                <Loader loading={this.state.loading}/>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Box f={1} mb={'xs'}>
                        <Box>
                            <Text bold>Company Logo</Text>
                        </Box>
                        <TouchableOpacity onPress={() => {
                            this.setState({imageType: 'logo'})
                            this.refs.pickImageModal.open()
                        }} activeOpacity={0.8}>
                            <Box bg={'white'} h={height / 3} center align={'center'} radius={'xs'} style={{
                                borderWidth: 0.5,
                                borderColor: 'rgba(0,0,0,0.2)',
                                elevation: 3,
                                position: 'relative'
                            }}>
                                {
                                    this.state.company_logo_uri && this.state.company_logo_uri !== 'old' ?
                                        <Box>
                                            <Image source={{uri: this.state.company_logo_uri}}
                                                   style={{
                                                       width: width / 1.09,
                                                       height: height / 3.1,
                                                       resizeMode: 'stretch'
                                                   }}/>
                                        </Box>
                                        :
                                        <Icon name='camera' type='font-awesome' color={theme.color.black}
                                              size={25}/>
                                }
                            </Box>
                        </TouchableOpacity>

                        {
                            this.state.company_logo_uri ?
                                <TouchableOpacity onPress={() => {
                                    this.setState({mediaUri: this.state.company_logo_uri, imageType: 'logo'})
                                    this.refs.drawModal.open()
                                }} activeOpacity={0.8} style={{
                                    position: 'absolute',
                                    right: -width + 60,
                                    top: 30,
                                    left: 0,
                                }}>
                                    <Icon name={'drafting-compass'} type={"font-awesome-5"}
                                          color={theme.color.greenLight}
                                          size={18}/>
                                </TouchableOpacity>
                                :
                                <Box></Box>
                        }
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Company Name and Address</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'Type in the company name and address here'}
                                keyboardType={'default'}
                                val={this.state.company_name_and_address}
                                setState={(data) => this.setState({company_name_and_address: data})}
                                reference={(input) => {
                                    this._company_logo_uri = input;
                                }}
                                returnKey={"next"}
                                onSubmit={() =>
                                    this._equipment_name_and_description && this._equipment_name_and_description.focus()
                                }
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                style={styles.input}
                            />
                        </Box>
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Equipment Name and Description</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'Type in the name of equipment and description'}
                                keyboardType={'default'}
                                val={this.state.equipment_name_and_description}
                                setState={(data) => this.setState({equipment_name_and_description: data})}
                                reference={(input) => {
                                    this._equipment_name_and_description = input;
                                }}
                                returnKey={'next'}
                                onSubmit={() => this._asset_number && this._asset_number.focus()}
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                style={styles.input}
                                contentSize={(e) => this.setState({textInputHeight: e.nativeEvent.contentSize.height})}
                            />
                        </Box>
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Asset #</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'Type in the asset number of equipment'}
                                keyboardType={'default'}
                                val={this.state.asset_number}
                                setState={(data) => this.setState({asset_number: data})}
                                reference={(input) => {
                                    this._asset_number = input;
                                }}
                                returnKey={"next"}
                                onSubmit={() =>
                                    this._building_name && this._building_name.focus()
                                }
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                style={styles.input}
                            />
                        </Box>
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Building Name</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'Type in the name and location of asset'}
                                keyboardType={'default'}
                                val={this.state.building_name}
                                setState={(data) => this.setState({building_name: data})}
                                reference={(input) => {
                                    this._building_name = input;
                                }}
                                returnKey={"next"}
                                onSubmit={() =>
                                    this._department_and_author && this._department_and_author.focus()
                                }
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                style={styles.input}

                            />
                        </Box>
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Department - Author</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'Type in the department name and author name'}
                                keyboardType={'default'}
                                val={this.state.department_and_author}
                                setState={(data) => this.setState({department_and_author: data})}
                                reference={(input) => {
                                    this._department_and_author = input;
                                }}
                                returnKey={"next"}
                                onSubmit={() => null}
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                style={styles.input}

                            />
                        </Box>
                    </Box>
                    <Box dir={'row'}>
                        <Box f={0.5} style={{justifyContent: 'flex-start'}}>
                            <Box>
                                <Text bold>Rev Date</Text>
                            </Box>
                            <Box>
                                <DatePicker
                                    style={{width: width / 2.1}}
                                    date={this.state.rev_date}
                                    mode='date'
                                    placeholder='Select Rev Date'
                                    format='YYYY-MM-DD'
                                    minDate='1951-05-01'
                                    maxDate='2099-06-01'
                                    confirmBtnText='Confirm'
                                    cancelBtnText='Cancel'
                                    onDateChange={(date) => {
                                        this.setState({rev_date: date})
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box f={0.5} style={{justifyContent: 'flex-end'}}>
                            <Box>
                                <Text bold>Origin Date</Text>
                            </Box>
                            <Box>
                                <DatePicker
                                    style={{width: width / 2}}
                                    date={this.state.origin_date}
                                    mode='date'
                                    placeholder='Select Origin Date'
                                    format='YYYY-MM-DD'
                                    minDate='1951-05-01'
                                    maxDate='2099-06-01'
                                    confirmBtnText='Confirm'
                                    cancelBtnText='Cancel'
                                    useNativeDriver={true}
                                    onDateChange={(date) => {
                                        this.setState({origin_date: date})
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Box mb={'xs'}>
                        <Box>
                            <Text bold>Cautions</Text>
                        </Box>
                        <Box>
                            <MultiSelect
                                hideTags
                                items={this.state.allCautions}
                                uniqueKey="id"
                                ref={(component) => {
                                    this.multiSelect = component
                                }}
                                fixedHeight={true}
                                onSelectedItemsChange={(val) => this.setState({cautionsToSend: val})}
                                selectedItems={this.state.cautionsToSend}
                                selectText="Select cautions"
                                searchInputPlaceholderText="Search through cautions..."
                                tagRemoveIconColor={theme.color.greenLight}
                                tagBorderColor={theme.color.greenLight}
                                tagTextColor={theme.color.greenLight}
                                selectedItemTextColor={theme.color.greenLight}
                                selectedItemIconColor={theme.color.greenLight}
                                itemTextColor="#000"
                                displayKey="caution"
                                searchInputStyle={{color: theme.color.greenLight}}
                                submitButtonColor={theme.color.greenLight}
                                submitButtonText="Submit"
                                hideSubmitButton={true}
                                styleDropdownMenu={{paddingTop: theme.space.xs, ...styles.input}}
                                styleInputGroup={{width: '99%', height: '20%', ...styles.input}}
                                styleDropdownMenuSubsection={{...styles.input}}
                                styleItemsContainer={{
                                    ...styles.input,
                                    marginTop: theme.space["2xs"],
                                    paddingBottom: theme.space["2xs"]
                                }}
                                styleListContainer={styles.input}
                                styleRowList={{
                                    borderBottomColor: theme.color.greyLight,
                                    borderBottomWidth: 1
                                }}
                            />
                        </Box>
                    </Box>
                    <Box f={1} dir={'row'} mb={'xs'}>
                        <Box f={0.5} style={{justifyContent: 'flex-start'}} mr={'xs'}>
                            <Box center mb={'xs'}>
                                <Text bold>Photo 1</Text>
                                <Text italic size={'xs'} center>Take Photo of main electrical
                                    disconnect</Text>
                            </Box>
                            <TouchableOpacity onPress={() => {
                                this.setState({imageType: 'photo1'})
                                this.refs.pickImageModal.open()
                            }} activeOpacity={0.8}>
                                <Box bg={'white'} h={height / 3} center align={'center'} radius={'xs'}
                                     style={{
                                         borderWidth: 0.5,
                                         borderColor: 'rgba(0,0,0,0.2)',
                                         elevation: 3
                                     }}>
                                    {
                                        this.state.photo1_uri && this.state.photo1_uri !== 'old' ?
                                            <Image source={{uri: this.state.photo1_uri}}
                                                   style={{width: '95%', height: height / 3.1, resizeMode: 'stretch'}}/>
                                            :
                                            <Icon name='camera' type='font-awesome'
                                                  color={theme.color.black}
                                                  size={25}/>
                                    }
                                </Box>
                            </TouchableOpacity>
                            {
                                this.state.photo1_uri && this.state.photo1_uri !== 'old' ?
                                    <TouchableOpacity onPress={() => {
                                        this.setState({
                                            mediaUri: this.state.photo1_uri,
                                            imageType: 'photo1'
                                        })
                                        this.refs.drawModal.open()
                                    }} activeOpacity={0.8} style={{
                                        position: 'absolute',
                                        right: -width + 230,
                                        top: 90,
                                        left: 0,
                                    }}>
                                        <Icon name={'drafting-compass'} type={"font-awesome-5"}
                                              color={theme.color.greenLight}
                                              size={18}/>
                                    </TouchableOpacity>
                                    :
                                    <Box></Box>
                            }
                        </Box>
                        <Box f={0.5} style={{justifyContent: 'flex-end'}}>
                            <Box center mb={'xs'}>
                                <Text bold>Photo 2</Text>
                                <Text italic size={'xs'} center>Take photo of devices</Text>
                            </Box>
                            <TouchableOpacity onPress={() => {
                                this.setState({imageType: 'photo2'})
                                this.refs.pickImageModal.open()
                            }} activeOpacity={0.8}>
                                <Box bg={'white'} h={height / 3} center align={'center'} radius={'xs'}
                                     style={{
                                         borderWidth: 0.5,
                                         borderColor: 'rgba(0,0,0,0.2)',
                                         elevation: 3
                                     }}>
                                    {
                                        this.state.photo2_uri && this.state.photo2_uri !== 'old' ?
                                            <Image source={{uri: this.state.photo2_uri}}
                                                   style={{width: '95%', height: height / 3.1, resizeMode: 'stretch'}}/>
                                            :
                                            <Icon name='camera' type='font-awesome'
                                                  color={theme.color.black}
                                                  size={25}/>
                                    }
                                </Box>
                            </TouchableOpacity>
                            {
                                this.state.photo2_uri && this.state.photo2_uri !== 'old' ?
                                    <TouchableOpacity onPress={() => {
                                        this.setState({mediaUri: this.state.photo2_uri, imageType: 'photo2'})
                                        this.refs.drawModal.open()
                                    }} activeOpacity={0.8} style={{
                                        position: 'absolute',
                                        right: -width + 230,
                                        top: 90,
                                        left: 0,
                                    }}>
                                        <Icon name={'drafting-compass'} type={"font-awesome-5"}
                                              color={theme.color.greenLight}
                                              size={18}/>
                                    </TouchableOpacity>
                                    :
                                    <Box></Box>
                            }
                        </Box>
                    </Box>
                    <Box center mb={'xs'}>
                        <Box center mb={'xs'}>
                            <Text bold>Photo 3</Text>
                            <Text italic size={'xs'} center>Take photo of rest of devices</Text>
                        </Box>
                        <Box w={'50%'}>
                            <TouchableOpacity onPress={() => {
                                this.setState({imageType: 'photo3'})
                                this.refs.pickImageModal.open()
                            }} activeOpacity={0.8}>
                                <Box bg={'white'} h={height / 3} center align={'center'} radius={'xs'}
                                     style={{
                                         borderWidth: 0.5,
                                         borderColor: 'rgba(0,0,0,0.2)',
                                         elevation: 3
                                     }}>
                                    {
                                        this.state.photo3_uri && this.state.photo3_uri !== 'old' ?
                                            <Image source={{uri: this.state.photo3_uri}}
                                                   style={{width: '95%', height: height / 3.1, resizeMode: 'stretch'}}/>
                                            :
                                            <Icon name='camera' type='font-awesome'
                                                  color={theme.color.black}
                                                  size={25}/>
                                    }
                                </Box>
                            </TouchableOpacity>
                            {
                                this.state.photo3_uri && this.state.photo3_uri !== 'old' ?
                                    <TouchableOpacity onPress={() => {
                                        this.setState({mediaUri: this.state.photo3_uri, imageType: 'photo3'})
                                        this.refs.drawModal.open()
                                    }} activeOpacity={0.8} style={{
                                        position: 'absolute',
                                        right: -width + 230,
                                        top: 10,
                                        left: 0,
                                    }}>
                                        <Icon name={'drafting-compass'} type={"font-awesome-5"}
                                              color={theme.color.greenLight}
                                              size={18}/>
                                    </TouchableOpacity>
                                    :
                                    <Box></Box>
                            }
                        </Box>
                    </Box>
                    <Box m={'3xs'}>
                        <Box>
                            <Text bold>Always perform a machine stop before locking out disconnects</Text>
                        </Box>
                        {
                            this.state.devicesToShow &&
                            <Box bg={'white'} mb={'xs'}
                                 style={styles.input}>
                                <FlatList
                                    keyExtractor={(item, index) => item.id.toString() + Math.random()}
                                    data={this.state.devicesToShow}
                                    renderItem={({item}) => (
                                        <Box f={1} m={'2xs'} dir={'row'}>
                                            <Box ml={'2xs'} mr={'2xs'}
                                                 style={{justifyContent: "flex-start"}}>
                                                <Text color={'red'}>{item.id}</Text>
                                            </Box>
                                            <Box style={{justifyContent: 'center', flexShrink: 1}}
                                                 dir={'row'}>
                                                <Text color={'green'} f={1} style={{flexShrink: 1}}>
                                                    {item.source + ', ' + item.location + ', ' +
                                                    item.method + ', ' + item.check + ', ' + item.name}
                                                </Text>
                                            </Box>
                                            <Box ml={'2xs'} mr={'2xs'} style={{justifyContent: "flex-end"}}>
                                                <TouchableOpacity
                                                    onPress={() => this.deleteDevice(item.id)}>
                                                    <Box style={{backgroundColor: 'white'}} m={'xs'}>
                                                        <Icon name='trash' type='font-awesome'
                                                              color={theme.color.red}
                                                              size={18}/>
                                                    </Box>
                                                </TouchableOpacity>
                                            </Box>
                                        </Box>
                                    )}
                                />
                            </Box>
                        }
                        <Box center f={1}>
                            {
                                this.state.lock_and_tags_needed < 6 ?
                                    <TouchableOpacity onPress={() => this.refs.deviceInfoModal.open()}
                                                      style={{width: '35%'}}>
                                        <AnimatedBox
                                            h={theme.space['2xl']}
                                            center
                                            align='center'
                                            bg={theme.color.greenLight}
                                            style={{...styles.buttons}}
                                            radius={theme.space.sm}
                                        >
                                            <Text size={theme.text.size.sm} color='white'
                                                  weight={theme.text.weight.bold}>
                                                Add New
                                            </Text>
                                        </AnimatedBox>
                                    </TouchableOpacity>
                                    :
                                    <Text size={'sm'} bold center> Device IDs Maxed out</Text>
                            }
                            <Text size={'sm'} style={{textDecorationLine: 'underline'}} bold>Max 6 Device
                                IDs are
                                allowed per procedure</Text>
                        </Box>
                    </Box>
                    <Box>
                        <Box>
                            <Text bold>Locks & Tags Needed</Text>
                        </Box>
                        <Box>
                            <UserInput
                                placeholder={'will autofill from Device IDs'}
                                keyboardType={'default'}
                                setState={() => null}
                                val={this.state.lock_and_tags_needed.toString()}
                                reference={null}
                                returnKey={"next"}
                                onSubmit={() => this._email_to_send_on && this._email_to_send_on.focus()}
                                blur={true}
                                marginLeft={'3xs'}
                                marginRight={'3xs'}
                                editable={false}
                                style={{...styles.input, backgroundColor: theme.color.greyLightest}}
                            />
                        </Box>
                    </Box>
                    <Box f={1} w={'100%'}>
                        <Box mb={'sm'} mt={'sm'}>
                            <Checkbox
                                color={theme.color.greenLight}
                                value={this.state.create_pdf}
                                initialValue={this.state.create_pdf}
                                label="Do you want to generate its PDF and QR Code?"
                                onChange={(val) => this.setState({create_pdf: val})}
                            />
                        </Box>
                        {this.state.create_pdf ?
                            <Box>
                                <Box>
                                    <Text bold>Email a copy to</Text>
                                </Box>
                                <Box>
                                    <UserInput
                                        placeholder={'Type in an email address here'}
                                        keyboardType={'email-address'}
                                        val={this.state.email_to_send_on}
                                        setState={(data) => this.setState({email_to_send_on: data})}
                                        reference={(input) => {
                                            this._email_to_send_on = input;
                                        }}
                                        returnKey={null}
                                        onSubmit={Keyboard.dismiss}
                                        blur={false}
                                        marginLeft={'3xs'}
                                        marginRight={'3xs'}
                                        style={styles.input}
                                    />
                                </Box>
                            </Box>
                            :
                            <Box></Box>}
                        <Box center>
                            <TouchableOpacity onPress={() => this.CREATE()} style={{width: '70%'}}>
                                <AnimatedBox
                                    h={theme.space['2xl']}
                                    center
                                    align='center'
                                    bg={theme.color.greenLight}
                                    style={{...styles.buttons}}
                                    radius={theme.space.sm}
                                >
                                    <Text size={theme.text.size.sm} color='white'
                                          weight={theme.text.weight.bold}>
                                        {this.state.create_pdf ? 'Create' : 'Save'}
                                    </Text>
                                </AnimatedBox>
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </ScrollView>

                <Modal style={styles.deviceInfoModal} position={'bottom'} ref={'deviceInfoModal'} swipeToClose={false}
                       useNativeDriver={true} backButtonClose={true}>
                    <Box f={1} mt={'sm'}>
                        <Box align={'center'} center mb={'sm'}>
                            <Text bold center>Add Device IDs and Other Information</Text>
                        </Box>
                        <Box f={1} mb={'sm'}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <UserInput
                                    placeholder={'Type in Location of Device at Equipment'}
                                    keyboardType={'default'}
                                    setState={(data) => this.setState({selectedDeviceLocation: data})}
                                    reference={(input) => {
                                        this.deviceLocation = input;
                                    }}
                                    returnKey={"next"}
                                    onSubmit={Keyboard.dismiss}
                                    blur={true}
                                    marginLeft={'3xs'}
                                    marginRight={'3xs'}
                                    style={{...styles.input}}
                                />
                                <Box mb={'xs'} mt={theme.space["2xs"]}>
                                    <DropDownPicker
                                        items={this.state.deviceIDs}
                                        placeholder="Tap to select Device ID"
                                        searchable={true}
                                        searchablePlaceholder="Search for a device ID"
                                        searchablePlaceholderTextColor="gray"
                                        seachableStyle={{}}
                                        searchableError={() => <Text>Not Found</Text>}
                                        defaultValue={this.state.selectedDeviceID}
                                        containerStyle={{height: theme.space['xl']}}
                                        style={{backgroundColor: '#fafafa'}}
                                        itemStyle={{justifyContent: 'flex-start'}}
                                        dropDownStyle={{backgroundColor: '#fafafa'}}
                                        onChangeItem={item => this.setState({
                                            selectedDeviceID: item.value,
                                            selectedDeviceIDToShow: item.label
                                        })}
                                        dropDownMaxHeight={200}
                                    />
                                </Box>
                                <Box mb={'xs'}>
                                    <DropDownPicker
                                        items={this.state.deviceSources}
                                        placeholder="Tap to select Energy Source Description"
                                        searchable={true}
                                        searchablePlaceholder="Search for a device source"
                                        searchablePlaceholderTextColor="gray"
                                        seachableStyle={{}}
                                        searchableError={() => <Text>Not Found</Text>}
                                        defaultValue={this.state.selectedDeviceSource}
                                        containerStyle={{height: theme.space['xl']}}
                                        style={{backgroundColor: '#fafafa'}}
                                        itemStyle={{justifyContent: 'flex-start'}}
                                        dropDownStyle={{backgroundColor: '#fafafa'}}
                                        onChangeItem={item => this.setState({
                                            selectedDeviceSource: item.value,
                                            selectedDeviceSourceToShow: item.label
                                        })}
                                        dropDownMaxHeight={200}
                                    />
                                </Box>
                                <Box mb={'xs'}>
                                    <DropDownPicker
                                        items={this.state.deviceMethods}
                                        placeholder="Tap to select Method of Device Isolation"
                                        searchable={true}
                                        searchablePlaceholder="Search for a device method"
                                        searchablePlaceholderTextColor="gray"
                                        seachableStyle={{}}
                                        searchableError={() => <Text>Not Found</Text>}
                                        defaultValue={this.state.selectedDeviceMethod}
                                        containerStyle={{height: theme.space['xl']}}
                                        style={{backgroundColor: '#fafafa'}}
                                        itemStyle={{justifyContent: 'flex-start'}}
                                        dropDownStyle={{backgroundColor: '#fafafa'}}
                                        onChangeItem={item => this.setState({
                                            selectedDeviceMethod: item.value,
                                            selectedDeviceMethodToShow: item.label
                                        })}
                                        dropDownMaxHeight={200}
                                    />
                                </Box>
                                <Box mb={'xs'}>
                                    <DropDownPicker
                                        items={this.state.deviceChecks}
                                        placeholder="Tap to select Verification of Isolation"
                                        searchable={true}
                                        searchablePlaceholder="Search for a device check"
                                        searchablePlaceholderTextColor="gray"
                                        seachableStyle={{}}
                                        searchableError={() => <Text>Not Found</Text>}
                                        defaultValue={this.state.selectedDeviceCheck}
                                        containerStyle={{height: theme.space['xl']}}
                                        style={{backgroundColor: '#fafafa'}}
                                        itemStyle={{justifyContent: 'flex-start'}}
                                        dropDownStyle={{backgroundColor: '#fafafa'}}
                                        onChangeItem={item => this.setState({
                                            selectedDeviceCheck: item.value,
                                            selectedDeviceCheckToShow: item.label
                                        })}
                                        dropDownMaxHeight={200}
                                    />
                                </Box>
                                <Box mb={height / 5}>
                                    <DropDownPicker
                                        items={this.state.deviceNames}
                                        placeholder="Tap to select type of lock out device needed"
                                        searchable={true}
                                        searchablePlaceholder="Search for a device name"
                                        searchablePlaceholderTextColor="gray"
                                        seachableStyle={{}}
                                        searchableError={() => <Text>Not Found</Text>}
                                        defaultValue={this.state.selectedDeviceName}
                                        containerStyle={{height: theme.space['xl']}}
                                        style={{backgroundColor: '#fafafa'}}
                                        itemStyle={{justifyContent: 'flex-start'}}
                                        dropDownStyle={{backgroundColor: '#fafafa'}}
                                        onChangeItem={item => this.setState({
                                            selectedDeviceName: item.value,
                                            selectedDeviceNameToShow: item.label
                                        })}
                                        dropDownMaxHeight={200}
                                    />
                                </Box>
                                <TouchableOpacity onPress={() => this.appendDevices()}
                                                  style={{width: '70%', alignSelf: "center", justifyContent: "center"}}>
                                    <AnimatedBox
                                        h={theme.space['2xl']}
                                        center
                                        align='center'
                                        bg={theme.color.greenLight}
                                        style={{...styles.buttons}}
                                        radius={theme.space.sm}
                                    >
                                        <Text size={theme.text.size.sm} color='white' weight={theme.text.weight.bold}>
                                            Save
                                        </Text>
                                    </AnimatedBox>
                                </TouchableOpacity>
                            </ScrollView>
                        </Box>
                    </Box>
                </Modal>

                <Modal style={styles.pickImageModal} position={'center'} ref={'pickImageModal'} swipeToClose={false}
                       useNativeDriver={false} backButtonClose={true}>
                    <Box f={1} justify={'center'} w={'100%'}>
                        <TouchableOpacity onPress={() => this.pickImage(this.state.imageType, 'camera')}
                                          style={{
                                              borderBottomColor: 'black',
                                              borderBottomWidth: 2,
                                              marginLeft: theme.space.sm,
                                              marginRight: theme.space.sm,
                                              height: '20%',
                                              justifyContent: 'center'
                                          }}>
                            <Text>Open Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.pickImage(this.state.imageType, 'gallery')}
                                          style={{
                                              borderBottomColor: 'black',
                                              borderBottomWidth: 2,
                                              marginLeft: theme.space.sm,
                                              marginRight: theme.space.sm,
                                              height: '20%',
                                              justifyContent: 'center'
                                          }}>
                            <Text>Pick from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this.setState({
                                selectedColor: '#000',
                                strokeColor: '#000',
                                strokeWidth: 4,

                                isDrawActive: true,
                                isOptionsActive: false,

                                strokesCount: 0,
                                mediaUri: null,
                            })
                            this.refs.drawModal.open()
                            this.refs.pickImageModal.close()
                        }}
                                          style={{
                                              borderBottomColor: 'black',
                                              borderBottomWidth: 2,
                                              marginLeft: theme.space.sm,
                                              marginRight: theme.space.sm,
                                              height: '20%',
                                              justifyContent: 'center'
                                          }}>
                            <Text>Draw</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.pickImage(this.state.imageType, '', 'clear')}
                                          style={{
                                              borderBottomColor: 'black',
                                              borderBottomWidth: 0.5,
                                              marginLeft: theme.space.sm,
                                              marginRight: theme.space.sm,
                                              height: '20%',
                                              marginTop: theme.space.xs,
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                              backgroundColor: theme.color.greyLighter,
                                              borderRadius: 2
                                          }}>
                            <Text color={theme.color.greyDarker} size={'sm'}>Clear Selection</Text>
                        </TouchableOpacity>
                    </Box>
                </Modal>

                <AwesomeAlert
                    show={this.state.showAlert}
                    showProgress={false}
                    title={this.state.alertTitle}
                    message={this.state.alertMessage}
                    closeOnTouchOutside={false}
                    closeOnHardwareBackPress={false}
                    showCancelButton={this.state.showCancelButton}
                    showConfirmButton={this.state.showSuccessButton}
                    confirmText="Ok"
                    cancelText="Ok"
                    confirmButtonColor={theme.color.greenLight}
                    cancelButtonColor={theme.color.redLight}
                    onConfirmPressed={() => this.setState({showAlert: false})}
                    onCancelPressed={() => this.setState({showAlert: false})}
                />

                <Modal position={'top'} ref={'drawModal'} swipeToClose={false}
                       useNativeDriver={false} backButtonClose={true} onOpened={() => {
                    this.setState({
                        selectedColor: '#387fff',
                        strokeColor: '#387fff',
                        strokeWidth: 4,
                        strokesCount: 0,
                    })
                }}>
                    <Box style={{flex: 1, height: '100%'}}>
                        <Box
                            collapsable={false}
                            ref={ref => (this._editorRef = ref)}
                            style={{
                                flex: 1,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                alignSelf: 'center',
                                justifyContent: "center",
                                alignItems: 'center'
                            }}>
                            {this.state.mediaUri && <Image source={{uri: this.state.mediaUri}} style={{
                                height: "100%",
                                width: "100%",
                                resizeMode: 'contain',
                                alignSelf: 'center',
                            }}/>}
                            <DrawPad
                                ref={ref => (this._drawRef = ref)}
                                drawActive={this.state.isDrawActive}
                                actionType={this.state.actionType}
                                moveAble={this.state.moveAble}
                                handleEditText={() => {
                                    this.setState({actionType: ''})
                                }}
                                // strokes={this.state.strokes}
                                containerStyle={{
                                    //backgroundColor: 'rgba(0,0,0,0.1)',
                                    backgroundColor: 'transparent',
                                    flex: 1,
                                    position: 'absolute',
                                    alignSelf: "center",
                                    height: "100%",
                                    width: "100%",
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}
                                color={this.state.strokeColor}
                                strokeWidth={this.state.strokeWidth * 2}
                                onChangeStrokes={(strokes) => {
                                    this.setState({
                                        // strokes: strokes,
                                        isOptionsActive: false,
                                        strokesCount: strokes.length,
                                    });
                                    // Keyboard.dismiss();
                                }}
                                onClear={() => {
                                    this.setState({
                                        isOptionsActive: false,
                                        strokesCount: 0,
                                    });
                                }}
                            />
                        </Box>
                        {this.renderTopBar()}
                        {this.renderBottomBar()}
                        {this.renderEditorOptions()}
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default NewProcedureScreen

const styles = StyleSheet.create({
    buttons: {
        marginHorizontal: theme.space.sm,
        marginVertical: theme.space['2xs'],
        elevation: 3,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },
    deviceInfoModal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 1.3
    },
    pickImageModal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 3,
        width: width / 1.3
    },
    cautionsModal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 1.3,
        width: width,
    },
    separator: {
        height: 1,
        backgroundColor: '#bbbbbb',
    },
    input: {
        elevation: 3,
        backgroundColor: theme.color.white,
        fontSize: theme.text.size.base,
        borderRadius: theme.radius.xs,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },

    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    topBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    bottomBar: {
        flex: 1,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    toggleButton: {
        flex: 0.1,
        height: 40,
        marginHorizontal: 2,
        marginBottom: 10,
        marginTop: 20,
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
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
