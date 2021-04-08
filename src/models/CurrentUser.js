import React from 'react';
import {flow, types} from 'mobx-state-tree';
import AsyncStorage from '@react-native-community/async-storage';

import {BaseApi} from '../api/api';
import {NavigationService} from '../api/NavigationService';
import strings from '../constants/strings';

const UserInfo = types.model('UserInfo', {
    id: types.maybeNull(types.number),
    name: types.maybeNull(types.string),
    email: types.maybeNull(types.string),
    profile_photo_url: types.maybeNull(types.string),
    current_team_id: types.maybeNull(types.number),
    email_verified_at: types.maybeNull(types.string),
    procedures_count: types.maybeNull(types.number),
    address: types.maybeNull(types.string),
    phone: types.maybeNull(types.string),
    stripe_id: types.maybeNull(types.string),
    card_brand: types.maybeNull(types.string),
    card_last_four: types.maybeNull(types.string),
    trial_ends_at: types.maybeNull(types.string),
});

export const CurrentUser = types
    .model('CurrentUser', {
        info: types.maybeNull(UserInfo),
        authToken: types.maybe(types.string),
    })
    .actions((self) => ({
        setupAuth: flow(function* () {
            yield self.getAuthToken();
        }),
        getAuthToken: flow(function* () {
            try {
                const token = yield AsyncStorage.getItem(strings.USER_TOKEN_KEY);
                if (token) {
                    self.authToken = token;
                    let res = yield self.getUserInfo();
                    res === 'Unauthenticated.'
                        ? NavigationService.navigate('Auth')
                        : NavigationService.navigate('App');
                } else {
                    NavigationService.navigate('Auth');
                }
            } catch (error) {
                console.warn('error: get_auth_token', error);
            }
        }),
        saveAuthToken: flow(function* (token) {
            try {
                yield AsyncStorage.setItem(strings.USER_TOKEN_KEY, token);
                yield self.getAuthToken();

            } catch (error) {
                console.warn('error: save_auth_token', error);
            }
        }),
        getUserInfo: flow(function* () {
            let res
            if (self.authToken) {
                try {
                    res = yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/user')
                        .auth(`Bearer ${self.authToken}`)
                        .headers({
                            Accept: 'application/json',
                        })
                        .get()
                        .json();

                    if (res.status === 200)
                        self.info = res.data.user;

                } catch (e) {
                    console.warn('error: get_user', e)
                    return JSON.parse(e.message).message
                }
            } else {
                NavigationService.navigate('Auth')
            }
        }),
        login: flow(function* (email, password, device) {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/login')
                    .post({
                        email: email,
                        password: password,
                        device: device,
                    })
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: login', error);
            }
        }),
        register: flow(function* (name, email, password, device) {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/register')
                    .post({
                        name, email, password, device,
                        'is-mas-safety': true
                    })
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: register', error);
            }
        }),
        logout: flow(function* (device, token = null) {
            try {
                yield AsyncStorage.removeItem(strings.USER_TOKEN_KEY);
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/logout')
                    .auth(`Bearer ${token != null ? token : self.authToken}`)
                    .post({device: device})
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: logout', error);
            }
        }),
        forgot_password: flow(function* (email) {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/forgot-password')
                    .post({email: email})
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: forgot_password', error);
            }
        }),
        update_profile: flow(function* (name, email, address, phone, profile_photo_uri, profile_photo_name, profile_photo_type) {
            try {
                let formData = new FormData()

                let body = {name, email, address, phone}

                formData.append('data', {
                    'string': JSON.stringify(body),
                    type: 'application/json'
                })
                formData.append('profile-photo', {
                    uri: profile_photo_uri,
                    name: profile_photo_name,
                    type: profile_photo_type
                })
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/update-profile')
                    .auth(`Bearer ${self.authToken}`)
                    .body(formData)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: update_profile', error);
            }
        }),
        request_verification: flow(function* () {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.AUTH + '/request-verification')
                    .auth(`Bearer ${self.authToken}`)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    })
                    .json();
            } catch (error) {
                console.warn('error: request_verification', error);
            }
        }),
        create_procedure: flow(function* (data) {
            try {
                let formData = formulate_data(data)
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/create-procedure')
                    .auth(`Bearer ${self.authToken}`)
                    .headers({
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data',
                    })
                    .body(formData)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json()

            } catch (error) {
                console.warn('error: create_procedures', error);
            }
        }),
        create_procedure_from_template: flow(function* (id, data) {
            try {
                let formData = formulate_data(data)
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/create-from-template/' + id)
                    .auth(`Bearer ${self.authToken}`)
                    .headers({
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data',
                    })
                    .body(formData)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json()
            } catch (error) {
                console.warn('error: create_procedure_from_template', error);
            }
        }),
        saved_procedures: flow(function* () {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/saved-procedures')
                    .auth(`Bearer ${self.authToken}`)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json();
            } catch (error) {
                console.warn('error: saved_procedures', error);
            }
        }),
        pdf_procedures: flow(function* () {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/pdf-procedures')
                    .auth(`Bearer ${self.authToken}`)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json();
            } catch (error) {
                console.warn('error: pdf_procedures', error);
            }
        }),
        generate_pdf: flow(function* (id) {
            try {
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/create-pdf/' + id)
                    .auth(`Bearer ${self.authToken}`)
                    .headers({
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data',
                    })
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json()
            } catch (error) {
                console.warn('error: generate_pdf', error);
            }
        }),
        delete_procedure: flow(function* (id) {
            try {
                console.log('deleting:', id)
                return yield BaseApi.url(strings.API + strings.VERSION + strings.APP + strings.MAS_SAFETY + '/delete-procedure/' + id)
                    .auth(`Bearer ${self.authToken}`)
                    .post()
                    .error(422, (error) => {
                        return error.message;
                    }).json();
            } catch (error) {
                console.warn('error: delete_procedure', error);
            }
        })
    }));

const formulate_data = (data) => {
    let formData = new FormData()
    let body = {
        company_name_and_address: data.company_name_and_address,
        equipment_name_and_description: data.equipment_name_and_description,
        asset_number: data.asset_number,
        building_name: data.building_name,
        department_and_author: data.department_and_author,
        cautions: data.cautions,
        rev_date: data.rev_date,
        origin_date: data.origin_date,
        devices: data.devices,
        lock_and_tags_needed: data.lock_and_tags_needed,
        email_to_send_on: data.email_to_send_on,
        create_pdf: data.create_pdf,
        company_logo_check: data.company_logo_check,
        photo1_check: data.photo1_check,
        photo2_check: data.photo2_check,
        photo3_check: data.photo3_check,
    }
    formData.append('data', {
        'string': JSON.stringify(body),
        type: 'application/json'
    })
    if (data.company_logo_file_name !== "")
        formData.append('company_logo', {
            uri: data.company_logo_uri,
            name: data.company_logo_file_name,
            type: data.company_logo_type
        })
    if (data.photo1_file_name !== "")
        formData.append('photo1', {
            uri: data.photo1_uri,
            name: data.photo1_file_name,
            type: data.photo1_type
        })
    if (data.photo2_file_name !== "")
        formData.append('photo2', {
            uri: data.photo2_uri,
            name: data.photo2_file_name,
            type: data.photo2_type
        })
    if (data.photo3_file_name !== "")
        formData.append('photo3', {
            uri: data.photo3_uri,
            name: data.photo3_file_name,
            type: data.photo3_type
        })

    return formData
}
