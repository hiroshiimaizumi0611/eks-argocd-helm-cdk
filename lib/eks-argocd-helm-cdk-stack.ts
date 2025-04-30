import * as cdk from 'aws-cdk-lib'
import type { Construct } from 'constructs'
import { VpcConstruct } from './constructs/vpc'

export class EksArgocdHelmCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    new VpcConstruct(this, 'vpc')
  }
}
