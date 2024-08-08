# Kazaswap Infra

To create the terraform state bucket if it doesn't exist yet
```sh
$ aws --profile bgr s3api create-bucket --bucket kazaswap-tfstates-multiregion --acl private --region eu-west-3 --create-bucket-configuration LocationConstraint=eu-west-3
```