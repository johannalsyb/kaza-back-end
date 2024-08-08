/*
    id UUID NOT NULL DEFAULT UUID(),
    type VARCHAR(255) NOT NULL,
    expiry BIGINT NOT NULL,
    data VARCHAR(3000) DEFAULT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
*/

export type Temp = {
    id: string,
    type: string,
    expiry: number,
    data: string,
    createdAt: string,
    updatedAt: string,
}

export default Temp