/*
`CREATE TABLE orgs (
    id VARCHAR NOT NULL DEFAULT CONCAT('o',REPLACE(REPLACE(CONCAT(RAND()*10,UUID(),RAND()*10),'-',''),'.','')),
    name VARCHAR(255) NOT NULL,
    createdBy VARCHAR NOT NULL,
    createdAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    updatedAt VARCHAR(255) NOT NULL DEFAULT DATE_FORMAT(UTC_TIMESTAMP(3),"%Y-%m-%dT%TZ"),
    PRIMARY KEY (id)
);`,
*/

/* Create a type based on the above sql table */ 
export type Org = {
    id: string,
    name: string,
    createdBy: string,
    createdAt: string,
    updatedAt: string,
}

export default Org
