import wretch from "wretch";
import strings from "../constants/strings";

export const BaseApi = wretch(strings.BASE_URL);
