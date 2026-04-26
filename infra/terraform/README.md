# TinyBooth infra (Terraform)

Mirror of the layout used in `bookish/bookish-infra/`.

```
infra/terraform/
  modules/        Reusable composable modules (ses-domain, github-oidc, twilio-secret, etc.)
  environments/
    staging/      Per-env state, variables, and module composition
    production/
  shared/         Cross-environment resources (IAM baseline, GH OIDC trust)
```

Per Phase 0 plan, no resources are defined yet. The `main.tf` files have a provider stub and a commented-out S3 backend block. Camrynn must hand over an AWS account ID and region preference before any `terraform init` can run against a real backend.

## When Camrynn provides AWS credentials

1. Uncomment the `backend "s3"` block in each `environments/*/main.tf`.
2. Fill the bucket and DynamoDB lock table names in `terraform.tfvars`.
3. `cd infra/terraform/environments/staging && terraform init`.
4. `terraform plan`. CI will post the diff on PRs touching `infra/**` (Phase 1).
5. `terraform apply` is manual-dispatch only. Never auto-applied.

Until then, this directory is a scaffold. Nothing here costs money or touches a real AWS account.
