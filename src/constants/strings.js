const strings = {
    //api strings
    BASE_URL: 'https://3dholoqr.com',
    //BASE_URL: "http://192.168.100.17",
    API: '/api',
    VERSION: '/v1',
    AUTH: '/auth',
    APP: '/app',
    MAS_SAFETY: '/mas-safety',

    //app string
    app_name: "MAS Safety Procedures",
    app_title: "MAS Safety Procedures App",
    display_name: "MAS Safety",
    read_terms: "Read Terms & Conditions Here",
    forgot: "Forgot Password?",
    USER_TOKEN_KEY: "@massafety/current-user-token",
    ios: 'IOS',
    android: 'ANDROID',
    web: 'web',

    //errors
    required_email: "Email field is required",
    required_password: "Password field is required",
    required_confirm_password: "Confirm Password field is required",
    required_address: "Address field is required",
    required_phone: "Phone field is required",
    all_empty: "One of more fields are left empty, check all the fields and try again",
    password_mismatch: "Password fields does not match",
    short_password: "Password must be at least 8 characters",
    went_wrong: "somewhere, somehow, something went wrong",
    email_not_verified:
        'Your email is not verified!\nPlease check your email box and click on "confirm email"',

    is_required: ":field is required",
    at_least: ":field must have at least :number characters",
    at_most: ":field must have at most :number characters",

    //debugging
    SENTRY_DNS: 'https://5c3a72ee0d124f3e82766d4fcc2440bc@o468022.ingest.sentry.io/5507147',

};

export default strings
