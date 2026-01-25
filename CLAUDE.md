- aws free tier as much as possible, scalable enough to change quickly if many users start to appear.

- Environment:
env | grep AWS, should give you the aws auth keys for any operation that requires it.

- infrastructure:
this projects cloud infrastructure follows a serverless approach, using lambda for backend, s3 for front end, github actions as a deploy mechanism, infrastructure as code is using terraform, assume this terminal has terraform, gh, aws cli installed.

- UI/UX: try to keep it minimal but reactive, web first, mobile, ipad, use https://ui.shadcn.com/ shadcn ui minimalistic approach and its theme, install it if necessary.

- backend: to your discretion, currently we use bun, but can be fastapi.

- Prototype first:
iteration is necessary, give a MVP and show to the user before keep adding features, but always keep it production ready, no placeholders or things that could change too much on production, for example, use aws cognito for google auth inmediately and don't waste time on other types of login that we need to eventually replace with cognito.

- auth: use google cognito for aws.

- security:. setup CORS, quickly and be able to respondo to usual issues with it, add localhost to CORS as well to be able to debug things locally

- document workflows and issues / fixes , don't add this to github.

- when commiting, don't self include "made with claude"

- keep comments production based, don't put "change this in production, or this is an example, like it was not made by a human"

- aws region is canada central 1

- use gh to create and manipulate github repos
