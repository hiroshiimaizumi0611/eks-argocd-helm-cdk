import { Construct } from 'constructs'
import { type Cluster, KubernetesManifest } from 'aws-cdk-lib/aws-eks'

export class ArgoCdConstruct extends Construct {
  constructor(scope: Construct, id: string, cluster: Cluster) {
    super(scope, id)

    // ArgoCD Helmチャートのインストール
    const argoChart = cluster.addHelmChart('argo-cd', {
      chart: 'argo-cd',
      repository: 'https://argoproj.github.io/argo-helm',
      release: 'argo-cd',
      namespace: 'argocd',
      createNamespace: true,
      values: {
        server: {
          service: {
            type: 'ClusterIP', // Ingress経由で使うので、ClusterIPにしておく
          },
        },
      },
    })

    // ArgoCD Server用の Service を ClusterIP で作成
    new KubernetesManifest(this, 'ArgoCdServerService', {
      cluster,
      manifest: [
        {
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: 'argocd-server',
            namespace: 'argocd',
            labels: {
              app: 'argocd-server',
            },
          },
          spec: {
            type: 'ClusterIP',
            ports: [
              {
                port: 80,
                targetPort: 8080,
              },
            ],
            selector: {
              app: 'argocd-server',
            },
          },
        },
      ],
      prune: false,
    }).node.addDependency(argoChart)

    // ArgoCD Server用 Ingress (ALB を作成する)
    new KubernetesManifest(this, 'ArgoCdServerIngress', {
      cluster,
      manifest: [
        {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: {
            name: 'argocd-server-ingress',
            namespace: 'argocd',
            annotations: {
              'kubernetes.io/ingress.class': 'alb',
              'alb.ingress.kubernetes.io/scheme': 'internet-facing',
              'alb.ingress.kubernetes.io/target-type': 'ip',
              'alb.ingress.kubernetes.io/backend-protocol': 'HTTPS',
              'alb.ingress.kubernetes.io/listen-ports': '[{"HTTP":80}]',
              'alb.ingress.kubernetes.io/healthcheck-path': '/healthz',
            },
          },
          spec: {
            rules: [
              {
                http: {
                  paths: [
                    {
                      path: '/',
                      pathType: 'Prefix',
                      backend: {
                        service: {
                          name: 'argo-cd-argocd-server',
                          port: {
                            number: 443,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      prune: false,
    }).node.addDependency(argoChart)
  }
}
