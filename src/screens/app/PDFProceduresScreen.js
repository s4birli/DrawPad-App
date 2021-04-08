import React, {Component} from 'react'
import {Dimensions, FlatList, Image, Linking, StyleSheet, TouchableHighlight, TouchableOpacity} from 'react-native'
import {Box, Text} from 'react-native-design-utility';
import AwesomeAlert from "react-native-awesome-alerts";
import {inject} from "mobx-react";
import Modal from 'react-native-modalbox';
import {Icon} from "react-native-elements";
import PDFReader from "rn-pdf-reader-js";
import {NavigationEvents} from "react-navigation";

import theme from '../../constants/theme';
import Loader from "../../components/Loader";
import strings from "../../constants/strings";

const {width, height} = Dimensions.get('window');

@inject("currentUser")
class PDFProceduresScreen extends Component {

    static navigationOptions = {
        title: 'PDF Procedures',
        headerStyle: {
            backgroundColor: theme.color.greenLight,
        },
        headerTintColor: theme.color.white,
        headerTitleStyle: {
            fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
    }
    CURRENT_USER = this.props.currentUser
    state = {
        errorText: "",
        alertTitle: "",
        alertMessage: "",
        showAlert: false,
        showSuccessButton: false,
        showCancelButton: false,
        cancelText: '',
        confirmText: '',
        loading: false,

        qr_code: '',
        procedures: [],
        pdf_uri: '',
        delete_id: '',

        downloadProgress: '',
    }

    componentDidMount() {
        this.GET_PDF_PROCEDURES().then()
    }

    GET_PDF_PROCEDURES = async () => {
        this.setState({loading: true});
        const result = await this.CURRENT_USER.pdf_procedures();
        console.log('pdf procedure result is', result.message)
        if (result.status === 200)
            this.setState({procedures: result.data.procedures})

        this.setState({loading: false});
    }

    show_alert = (
        show = true,
        show_error = true,
        show_success = false,
        title = '',
        message = '',
        confirmText = 'Ok',
        cancelText = 'Ok'
    ) => {
        this.setState({
            showAlert: show,
            showCancelButton: show_error,
            showSuccessButton: show_success,
            alertTitle: title,
            alertMessage: message,
            confirmText: confirmText,
            cancelText: cancelText
        });
    };

    makeDownload = async (pdf_url) => {
        this.setState({loading: true})
        try {
            await Linking.openURL(pdf_url);
        } catch (e) {
            console.error(e);
        }
        this.setState({loading: false})
    }

    DELETING_PROCEDURE = (id) => {
        this.show_alert(
            true, true, true,
            'Deleting Procedure', 'Do you want to delete this procedure?',
            'Yes! Delete Procedure', 'No, Cancel'
        )
        this.setState({delete_id: id})
    }

    DELETE_PROCEDURE_CONFIRMED = async (id) => {
        this.setState({loading: true});
        try {
            const result = await this.CURRENT_USER.delete_procedure(id)
            console.log('deleting procedure result is', result.message);
            if (result.status === 200) {
                this.setState({
                    loading: false,
                    delete_id: '',
                });
                this.show_alert(true, false, true, 'Procedure Deleted', result.message);
            } else {

                this.setState({
                    loading: false,
                    delete_id: '',
                });
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
            this.setState({
                loading: false,
                delete_id: '',
            });
        }

        this.GET_PDF_PROCEDURES().then()
    }
    isEmpty = (value) => {
        return (value == null || value.length === 0);
    }

    render() {
        return (
            <Box f={1} pt={'xs'} pb={'xs'}>
                <NavigationEvents onDidFocus={() => this.GET_PDF_PROCEDURES().then()}/>
                <Loader loading={this.state.loading}/>
                {
                    this.state.procedures ?
                        <FlatList
                            ItemSeparatorComponent={
                                Platform.OS !== 'android' &&
                                (({highlighted}) =>
                                        <Box style={[styles.separator, highlighted && {marginLeft: 0}]}/>
                                )
                            }
                            keyExtractor={(item, index) => item.id.toString()}
                            data={this.state.procedures}
                            renderItem={({item, index, separators}) => (
                                <Box f={1} p={'xs'} dir={'row'} bg={index % 2 === 0 ? 'greyLighter' : 'white'}
                                     w={'100%'}>
                                    <Box m={'xs'} style={{justifyContent: 'flex-start'}} f={0.2} dir={'row'}>
                                        <Text mr={'xs'}>{item.id}.</Text>
                                        <Icon name={'file-pdf'} type={"font-awesome-5"} color={'red'} size={20}/>
                                    </Box>
                                    <Box style={{justifyContent: 'center'}} ml={'sm'}>
                                        <Text>{(item.equipment_name_and_description + '-' + item.company_name_and_address).substring(0, 18) + "..."}</Text>
                                    </Box>
                                    <Box f={0.9} ml={'sm'} style={{justifyContent: 'flex-end'}} dir={'row'}>
                                        <Box m={'xs'}>
                                            <TouchableOpacity onPress={() => {
                                                this.setState({pdf_uri: strings.BASE_URL + '/' + item.file_path.replace('public', 'storage')})
                                                this.refs.pdfModal.open()
                                            }}
                                            >
                                                <Icon name={'eye'} type={"font-awesome-5"}
                                                      color={'green'} size={20}/>
                                            </TouchableOpacity>
                                        </Box>
                                        {
                                            !this.isEmpty(item.qr_code_path) &&
                                            <Box m={'xs'}>
                                                <TouchableOpacity
                                                    key={item.key}
                                                    activeOpacity={0.9}
                                                    onPress={() => {
                                                        this.setState({qr_code: strings.BASE_URL + '/' + item.qr_code_path.replace('public', 'storage')})
                                                        this.refs.qrCodeModal.open()
                                                    }}>
                                                    <Icon name={'qrcode'} type={"font-awesome-5"} color={'green'}
                                                          size={20}/>
                                                </TouchableOpacity>
                                            </Box>
                                        }
                                        <Box m={'xs'}>
                                            <TouchableOpacity
                                                key={item.key}
                                                activeOpacity={0.9}
                                                onPress={() => {
                                                    this.makeDownload(strings.BASE_URL + '/' + item.file_path.replace('public', 'storage')).then()
                                                }}>
                                                <Box>
                                                    <Icon name={'download'} type={"font-awesome-5"} color={'green'}
                                                          size={20}/>
                                                </Box>
                                            </TouchableOpacity>
                                        </Box>
                                        <Box m={'xs'}>
                                            <TouchableHighlight
                                                key={item.key}
                                                onPress={() => {
                                                    this.DELETING_PROCEDURE(item.id)
                                                }}>
                                                <Box>
                                                    <Icon name={'trash'} type={"font-awesome-5"} color={'red'}
                                                          size={20}/>
                                                </Box>
                                            </TouchableHighlight>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        />
                        :
                        <Box center><Text bold>No PDF procedures found!</Text></Box>
                }
                <Modal style={styles.qrCodeModal} position={'center'} ref={'qrCodeModal'}
                       swipeToClose={false}
                       useNativeDriver={false}
                       backButtonClose={true}>
                    <Box f={1} align={'center'} center>
                        <Image source={{uri: this.state.qr_code}}
                               style={{width: width / 1.2, height: height / 2.3, resizeMode: 'contain'}}/>
                        {/*<SvgUri
                            width={width / 1.2}
                            height={height / 2.1}
                            uri={this.state.qr_code}/>*/}
                    </Box>
                </Modal>

                <Modal style={styles.pdfModal} position={'center'} ref={'pdfModal'}
                       swipeToClose={false}
                       useNativeDriver={false}
                       backButtonClose={true}>
                    <Box f={1} align={'center'} center>
                        <PDFReader
                            style={{height: height / 1.19, width: width / 1.15}}
                            source={{uri: this.state.pdf_uri}}
                            withScroll={true}
                            withPinchZoom={true}
                            onError={() => alert('An error occurred while loading PDF. Please try again later.')}
                        />
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
                    confirmText={this.state.confirmText}
                    cancelText={this.state.cancelText}
                    confirmButtonColor={theme.color.greenLight}
                    cancelButtonColor={theme.color.redLight}
                    onConfirmPressed={() => {
                        this.setState({showAlert: false});
                        this.state.delete_id && this.DELETE_PROCEDURE_CONFIRMED(this.state.delete_id)
                    }}
                    onCancelPressed={() => {
                        this.setState({showAlert: false});
                    }}
                />

            </Box>
        )
    }
}

export default PDFProceduresScreen

const styles = StyleSheet.create({
    buttons: {
        marginHorizontal: theme.space.sm,
        marginVertical: theme.space['2xs'],
        elevation: 3,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },
    qrCodeModal: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 2.2,
        width: width / 1.1,
        borderRadius: theme.radius.sm
    },
    pdfModal: {
        backgroundColor: theme.color.greyDarker,
        justifyContent: 'center',
        alignItems: 'center',
        height: height / 1.1,
        width: width / 1.1,
        borderRadius: theme.radius.sm
    },
    separator: {
        height: 1,
        backgroundColor: '#bbbbbb',
    },
});
