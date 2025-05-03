import { Construct } from 'constructs'
import type { Cluster } from 'aws-cdk-lib/aws-eks'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'

// ALB ControllerをHelmチャートでインストールするカスタムConstruct
export class AlbControllerConstruct extends Construct {
  constructor(scope: Construct, id: string, cluster: Cluster) {
    super(scope, id)

    // ServiceAccountを作成（IAM Role for ServiceAccount: IRSA）
    const albSa = cluster.addServiceAccount('alb-controller-sa', {
      name: 'aws-load-balancer-controller',
      namespace: 'kube-system',
    })

    // ALB Controller用IAMポリシーを付与
    albSa.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
    )

    // 必要なら細かいカスタムポリシーも追加可能（今回はマネージドポリシーのみ）

    // HelmでAWS Load Balancer Controllerをインストール
    cluster.addHelmChart('aws-load-balancer-controller', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      release: 'aws-load-balancer-controller',
      namespace: 'kube-system',
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: {
          create: false, // ServiceAccountは自分で作ったので、Helmには作らせない
          name: albSa.serviceAccountName,
        },
        region: cluster.env.region,
        vpcId: cluster.vpc.vpcId,
      },
    })
  }
}
