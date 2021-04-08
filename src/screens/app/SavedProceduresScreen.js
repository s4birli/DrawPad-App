import React, {Component} from 'react'
import {Box, Text} from 'react-native-design-utility';
import {Dimensions, FlatList, Image, StyleSheet, TouchableHighlight, TouchableOpacity} from 'react-native';
import AwesomeAlert from "react-native-awesome-alerts";
import {inject} from "mobx-react";
import {Icon} from "react-native-elements";
import PDFReader from "rn-pdf-reader-js";
import {NavigationEvents} from "react-navigation";

import theme from '../../constants/theme';
import Loader from "../../components/Loader";
import Modal from "react-native-modalbox";
import strings from "../../constants/strings";
import {NavigationService} from "../../api/NavigationService";

const {width, height} = Dimensions.get('window');

@inject("currentUser")
class SavedProceduresScreen extends Component {

    static navigationOptions = {
        title: 'Saved Procedures',
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

        loading: false,
        showAlert: false,
        showConfirmButton: false,
        showCancelButton: false,
        confirmText: '',
        cancelText: '',

        procedures: [],

        qr_code: '',
        pdf_uri: '',
        procedure_id: '',

        delete_id: '',
    }

    componentDidMount() {
        this.GET_SAVED_PROCEDURES().then()
    }

    GET_SAVED_PROCEDURES = async () => {
        this.setState({loading: true});
        const result = await this.CURRENT_USER.saved_procedures();
        console.log('saved procedure result is', result.message);
        if (result.status === 200)
            this.setState({procedures: result.data.procedures})

        this.setState({loading: false});
    }

    show_alert = (
        show = true,
        show_error = true,
        show_success = false,
        title,
        message,
        confirmText = 'Ok',
        cancelText = 'Ok'
    ) => {
        this.setState({
            showAlert: show,
            showCancelButton: show_error,
            showConfirmButton: show_success,
            alertTitle: title,
            alertMessage: message,
            confirmText: confirmText,
            cancelText: cancelText
        });
    };

    CREATING_PDF = (id) => {
        this.show_alert(
            true, true, true,
            'Generating PDF/QR', 'Do you want to generate PDF/QR Code of procedure?',
            'Yes! create PDF/QR', 'No, Cancel'
        )
        this.setState({procedure_id: id})
    }

    CREATE_PDF_CONFIRMED = async (id) => {
        this.setState({loading: true});
        try {
            const result = await this.props.currentUser.generate_pdf(id);
            console.log('generating pdf of procedure result is', result.message);
            if (result.status === 200) {
                this.setState({
                    loading: false,
                    procedure_id: ''
                });
                this.show_alert(true, false, true, 'PDF Generated', result.message);
            } else {
                this.setState({
                    loading: false,
                    procedure_id: ''
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
                procedure_id: '',
            });
        }
        this.GET_SAVED_PROCEDURES().then()
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
            this.setState({loading: false});
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
        this.GET_SAVED_PROCEDURES().then()
    }

    isEmpty = (value) => {
        return (value == null || value.length === 0);
    }

    render() {
        return (
            <Box f={1} pb={'sm'} pt={'sm'} w={width} h={height}>
                <NavigationEvents onDidFocus={() => this.GET_SAVED_PROCEDURES().then()}/>
                <Loader loading={this.state.loading}/>
                {
                    this.state.procedures ?
                        <FlatList
                            ItemSeparatorComponent={
                                Platform.OS !== 'android' &&
                                (({highlighted}) =>
                                    <Box style={[styles.separator, highlighted && {marginLeft: 0}]}/>)
                            }
                            keyExtractor={(item, index) => item.id.toString()}
                            data={this.state.procedures}
                            renderItem={({item, index, separators}) => (
                                <Box f={1} p={'xs'} dir={'row'} bg={index % 2 === 0 ? 'greyLighter' : 'white'}
                                     w={'100%'}>
                                    <Box m={'xs'} style={{justifyContent: 'flex-start'}} f={0.25} dir={'row'} center
                                         align={'center'} justify={'center'}>
                                        <Text center align={'center'} justify={'center'} mr={'xs'}>{item.id}.</Text>
                                        <Icon center align={'center'} justify={'center'} name={'file'}
                                              type={"font-awesome-5"} color={'red'} size={20}/>
                                    </Box>
                                    <Box style={{justifyContent: 'center'}}>
                                        <Text>{(item.equipment_name_and_description + '-' + item.company_name_and_address).substring(0, 18) + "..."}</Text>
                                    </Box>
                                    <Box f={0.9} ml={'sm'} style={{justifyContent: 'flex-end'}} dir={'row'}>
                                        {
                                            !this.isEmpty(item.qr_code_path) &&
                                            <Box m={'xs'}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        this.setState({qr_code: strings.BASE_URL + '/' + item.qr_code_path.replace('public', 'storage')})
                                                        this.refs.qrCodeModal.open()
                                                    }}>
                                                    <Icon name={'qrcode'} type={"font-awesome-5"} color={'green'}
                                                          size={20}/>
                                                </TouchableOpacity>
                                            </Box>
                                        }
                                        {
                                            !this.isEmpty(item.file_path) ?
                                                <Box m={'xs'}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.setState({pdf_uri: strings.BASE_URL + '/' + item.file_path.replace('public', 'storage')})
                                                            this.refs.pdfModal.open()
                                                        }}>
                                                        <Icon name={'file-pdf'} type={"font-awesome-5"} color={'green'}
                                                              size={20}/>
                                                    </TouchableOpacity>
                                                </Box>
                                                :
                                                <Box m={'xs'}>
                                                    <TouchableOpacity
                                                        onPress={() => this.CREATING_PDF(item.id)}>
                                                        <Icon name={'pencil-ruler'} type={"font-awesome-5"}
                                                              color={'green'} size={20}/>
                                                    </TouchableOpacity>
                                                </Box>
                                        }
                                        <Box m={'xs'}>
                                            <TouchableHighlight
                                                key={item.key}
                                                onPress={() => NavigationService.navigate('NewProcedure', {
                                                    title: 'Procedure Details',
                                                    from: 'saved',
                                                    procedure: item
                                                })}>
                                                <Box><Icon name={'edit'} type={"font-awesome-5"} color={'green'}
                                                           size={20}/></Box>
                                            </TouchableHighlight>
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
                        <Box center><Text bold>No Saved procedures found!</Text></Box>
                }

                <Modal style={styles.qrCodeModal} position={'center'} ref={'qrCodeModal'}
                       swipeToClose={false}
                       useNativeDriver={false}
                       backButtonClose={true}>
                    <Box f={1} align={'center'} center>
                        <Image source={{uri: this.state.qr_code}}
                               style={{width: width / 1.2, height: height / 2.2, resizeMode: 'contain'}}/>
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
                    showConfirmButton={this.state.showConfirmButton}
                    confirmText={this.state.confirmText}
                    cancelText={this.state.cancelText}
                    confirmButtonColor={theme.color.greenLight}
                    cancelButtonColor={theme.color.redLight}
                    onConfirmPressed={() => {
                        this.setState({showAlert: false})
                        this.state.delete_id && this.DELETE_PROCEDURE_CONFIRMED(this.state.delete_id)
                        this.state.procedure_id && this.CREATE_PDF_CONFIRMED(this.state.procedure_id)
                    }}
                    onCancelPressed={() => {
                        this.setState({showAlert: false})
                    }}
                />

            </Box>
        )
    }
}

export default SavedProceduresScreen

const styles = StyleSheet.create({
    buttons: {
        marginHorizontal: theme.space.sm,
        marginVertical: theme.space['2xs'],
        elevation: 3,
        shadowOffset: {width: 2, height: 2},
        shadowColor: theme.color.black,
        shadowOpacity: theme.opacity.low,
    },
    separator: {
        height: 1,
        backgroundColor: '#bbbbbb',
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
});
