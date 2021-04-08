import React, {Component} from "react";
import {Dimensions, Image, Keyboard, Platform, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import {Box, Text} from 'react-native-design-utility'
import {inject} from "mobx-react";
import {Icon} from "react-native-elements";
import Modal from "react-native-modalbox";
import Animated from "react-native-reanimated";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import AwesomeAlert from "react-native-awesome-alerts";

import {HeaderHeight} from "../../constants/utils";
import theme from "../../constants/theme";
import UserInput from "../../shared/UserInput";
import Loader from "../../components/Loader";

const {width, height} = Dimensions.get("window");
const AnimatedBox = Animated.createAnimatedComponent(Box);

@inject('currentUser')
class ProfileScreen extends Component {
    CURRENT_USER = this.props.currentUser

    state = {
        user_name: '',
        user_email: '',
        user_address: '',
        user_phone: '',
        profile_photo_uri: '',
        profile_photo_file_name: '',
        profile_photo_type: '',

        showAlert: false,
        showCancelButton: false,
        showConfirmButton: false,
        alertTitle: '',
        alertMessage: '',

        loading: false,
    }

    componentDidMount() {
        this.setUpUserProfile().then()
        this.askPermissions().then()
    }

    setUpUserProfile = async () => {
        this.setState({
            user_name: this.CURRENT_USER.info.name,
            profile_photo_uri: this.CURRENT_USER.info.profile_photo_url,
            user_email: this.CURRENT_USER.info.email,
            user_address: this.CURRENT_USER.info.address,
            user_phone: this.CURRENT_USER.info.phone,
        })
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
        return uri.split('/').pop().split('.').pop()
    }

    pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.cancelled) {
            let file_uri = result.uri
            let file_name = this.getName(file_uri)
            let file_type = this.getType(file_uri)
            this.setState({
                profile_photo_uri: file_uri,
                profile_photo_file_name: file_name,
                profile_photo_type: file_type
            })
        }
    };

    show_alert = (
        show = true,
        show_cancel = true,
        show_confirm = false,
        title,
        message
    ) => {
        this.setState({
            showAlert: show,
            showCancelButton: show_cancel,
            showConfirmButton: show_confirm,
            alertTitle: title,
            alertMessage: message
        });
    };

    saveProfile = async () => {
        if (!this.state.user_name) {
            this.show_alert(
                true,
                true,
                false,
                "Name Error",
                'Name is a required field'
            );
            return;
        }
        if (!this.state.user_email) {
            this.show_alert(
                true,
                true,
                false,
                "Email Error",
                'Email is a required field'
            );
            return;
        }
        if (!this.state.user_address) {
            this.show_alert(
                true,
                true,
                false,
                "Address Error",
                'Address is a required field'
            );
            return;
        }
        if (!this.state.user_phone) {
            this.show_alert(
                true,
                true,
                false,
                "Phone Error",
                'Phone is a required field'
            );
            return;
        }
        if (!this.state.profile_photo_uri) {
            this.show_alert(
                true,
                true,
                false,
                "Profile Photo Error",
                'Profile Photo is required'
            );
            return;
        }

        this.setState({loading: true});
        try {
            const result = await this.CURRENT_USER.update_profile(
                this.state.user_name, this.state.user_email, this.state.user_address,
                this.state.phone, this.state.profile_photo_uri, this.state.profile_photo_file_name,
                this.state.profile_photo_type
            )

            console.log('updating profile result is', result.message);

            this.setState({loading: false});

            if (result.status === 200)
                this.show_alert(true, false, true, 'Profile', result.message);
            else {
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

        } catch (e) {
            console.log(e)
            this.setState({loading: false});
        }
    }

    render() {
        return (
            <Box f={1} style={styles.profile} h={height}>
                <Loader loading={this.state.loading}/>
                <Box f={1}>
                    <ScrollView showsVerticalScrollIndicator={false}
                                style={{width, marginTop: Platform.OS === 'android' ? '25%' : '0%'}}>
                        <Box f={1} style={styles.profileCard}>
                            <Box center mt={-80}>
                                <Image
                                    source={{uri: this.state.profile_photo_uri}}
                                    style={styles.avatar}
                                />
                            </Box>

                            <Box f={1}>
                                <Box center style={styles.nameInfo}>
                                    <Text bold size={theme.text.size["2xl"]} color="#32325D">
                                        {this.state.user_name}
                                    </Text>
                                    <Text size color="#32325D" style={{marginTop: 10}}>
                                        {this.state.user_email}
                                    </Text>
                                    <Text size color="#32325D" style={{marginTop: 10}}>
                                        {this.state.user_phone ?? ''}
                                    </Text>
                                    <Text size color="#32325D" style={{marginTop: 10}}>
                                        {this.state.user_address ?? ''}
                                    </Text>
                                </Box>
                                <Box center style={{marginTop: 30, marginBottom: 16}}>
                                    <Box style={styles.divider}/>
                                </Box>
                                <Box dir={'row'} style={{paddingVertical: 14, alignItems: "baseline"}}>
                                    {/*<TouchableOpacity
                                        onPress={() => {
                                            this.refs.profileModal.open()
                                        }}>
                                        <Icon name={'edit'} type={"font-awesome-5"} color={'green'}
                                              size={20}/>
                                    </TouchableOpacity>*/}
                                </Box>
                            </Box>
                        </Box>
                    </ScrollView>

                    <Modal style={styles.profileModal} position={'bottom'} ref={'profileModal'}
                           swipeToClose={true}
                           useNativeDriver={false}
                           backButtonClose={true}
                           onClosed={() => this.setState({profile_photo_uri: this.CURRENT_USER.info.profile_photo_url})}>
                        <Box f={1} mt={'sm'}>
                            <Box align={'center'} center mb={'sm'}>
                                <Text bold center>Edit Profile</Text>
                            </Box>
                            <Box mb={'2xl'} ml={'sm'} mr={'sm'}>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Box>
                                        <TouchableOpacity onPress={() => this.pickImage()} activeOpacity={0.8}>
                                            <Box bg={'white'} h={height / 3} center align={'center'} radius={'xs'}
                                                 style={{
                                                     borderWidth: 0.5,
                                                     borderColor: 'rgba(0,0,0,0.2)',
                                                     elevation: 3
                                                 }}>
                                                {
                                                    this.state.profile_photo_uri ?
                                                        <Image source={{uri: this.state.profile_photo_uri}}
                                                               style={{width: width / 1.13, height: height / 3.1}}/>
                                                        :
                                                        <Icon name='camera' type='font-awesome'
                                                              color={theme.color.black}
                                                              size={25}/>
                                                }
                                            </Box>
                                        </TouchableOpacity>
                                        <UserInput
                                            placeholder={'Your name'}
                                            keyboardType={'default'}
                                            val={this.state.user_name}
                                            setState={(data) => this.setState({user_name: data})}
                                            reference={(input) => {
                                                this._user_name = input;
                                            }}
                                            returnKey={"next"}
                                            onSubmit={() =>
                                                this._user_email && this._user_email.focus()
                                            }
                                            blur={true}
                                            marginLeft={'3xs'}
                                            marginRight={'3xs'}
                                            style={styles.input}
                                        />
                                        <UserInput
                                            placeholder={'Your email'}
                                            keyboardType={'email-address'}
                                            val={this.state.user_email}
                                            setState={(data) => this.setState({user_email: data})}
                                            reference={(input) => {
                                                this._user_email = input;
                                            }}
                                            returnKey={"next"}
                                            onSubmit={() =>
                                                this._user_phone && this._user_phone.focus()
                                            }
                                            blur={true}
                                            marginLeft={'3xs'}
                                            marginRight={'3xs'}
                                            style={styles.input}
                                        />
                                        <UserInput
                                            placeholder={'Your phone number'}
                                            keyboardType={'default'}
                                            val={this.state.user_phone}
                                            setState={(data) => this.setState({user_phone: data})}
                                            reference={(input) => {
                                                this._user_phone = input;
                                            }}
                                            returnKey={"next"}
                                            onSubmit={() =>
                                                this._user_address && this._user_address.focus()
                                            }
                                            blur={true}
                                            marginLeft={'3xs'}
                                            marginRight={'3xs'}
                                            style={styles.input}
                                        />
                                        <UserInput
                                            placeholder={'Your address'}
                                            keyboardType={'default'}
                                            val={this.state.user_address}
                                            setState={(data) => this.setState({user_address: data})}
                                            reference={(input) => {
                                                this._user_address = input;
                                            }}
                                            returnKey={"next"}
                                            onSubmit={Keyboard.dismiss}
                                            blur={true}
                                            marginLeft={'3xs'}
                                            marginRight={'3xs'}
                                            style={styles.input}
                                        />
                                        <TouchableOpacity onPress={() => this.saveProfile()}
                                                          style={{
                                                              width: '70%',
                                                              alignSelf: "center",
                                                              justifyContent: "center"
                                                          }}>
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
                                                    Save
                                                </Text>
                                            </AnimatedBox>
                                        </TouchableOpacity>
                                    </Box>
                                </ScrollView>
                            </Box>
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
                        showConfirmButton={this.state.showConfirmButton}
                        confirmText="Ok"
                        cancelText="Ok"
                        confirmButtonColor={theme.color.greenLight}
                        onConfirmPressed={() => {
                            this.setState({showAlert: false})
                            this.refs.procedureDetailsModal.close()
                            this.GET_SAVED_PROCEDURES().then()
                        }}
                        onCancelPressed={() => {
                            this.setState({showAlert: false})
                        }}
                    />
                </Box>
            </Box>
        );
    }
}

const styles = StyleSheet.create({
    profile: {
        marginTop: Platform.OS === 'android' ? -HeaderHeight : 0,
        // marginBottom: -HeaderHeight * 2,
        flex: 1
    },
    profileContainer: {
        width: width,
        height: height,
        padding: 0,
        zIndex: 1,
    },
    profileBackground: {
        width: width,
        height: height / 2,
        backgroundColor: 'green'
    },
    profileCard: {
        // position: "relative",
        padding: theme.space.sm,
        marginHorizontal: theme.space.sm,
        marginTop: 65,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        backgroundColor: theme.color.white,
        shadowColor: theme.color.black,
        shadowOffset: {width: 0, height: 0},
        shadowRadius: 8,
        shadowOpacity: 0.2,
        zIndex: 2
    },
    info: {
        paddingHorizontal: theme.space.xl
    },
    avatar: {
        width: 124,
        height: 124,
        borderRadius: theme.radius['3xl'],
        borderWidth: 0
    },
    nameInfo: {
        marginTop: theme.space.lg
    },
    divider: {
        width: "90%",
        borderWidth: 1,
        borderColor: "#E9ECEF"
    },
    profileModal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 1.2,
        backgroundColor: theme.color.greyLightest
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
});

export default ProfileScreen;
