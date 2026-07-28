import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `Jenkinsfile` — the Groovy pipeline definition committed
// at a repo root, swept alongside the YAML CI configs (CWE-200). Unlike its
// YAML siblings this one is Groovy, so it gets its own module rather than a
// branch of `fake-ci-pipeline`.
//
// A faithful Jenkinsfile pulls secrets through the credentials binding
// (`credentials('id')`, `withCredentials([...])`) rather than inlining them,
// so the decoy discloses the plausible pipeline structure and the credential
// *ids* a scanner wants to see while leaking nothing usable. The credential
// ids and agent labels are invented; hosts are `.invalid`. Fully static.

const body = `pipeline {
    agent {
        label 'linux && docker'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        REGISTRY      = 'registry.internal.invalid'
        IMAGE         = "\${REGISTRY}/app"
        REGISTRY_CRED = credentials('internal-registry')
        SONAR_HOST    = 'https://sonar.internal.invalid'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run lint'
                sh 'npm run test -- --reporter=junit --outputFile=reports/junit.xml'
            }
            post {
                always {
                    junit 'reports/junit.xml'
                }
            }
        }

        stage('Publish') {
            when {
                branch 'main'
            }
            steps {
                sh 'echo "$REGISTRY_CRED_PSW" | docker login -u "$REGISTRY_CRED_USR" --password-stdin $REGISTRY'
                sh 'docker build -t $IMAGE:$GIT_SHORT .'
                sh 'docker push $IMAGE:$GIT_SHORT'
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([file(credentialsId: 'prod-kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'kubectl --namespace production set image deployment/app app=$IMAGE:$GIT_SHORT'
                    sh 'kubectl --namespace production rollout status deployment/app --timeout=180s'
                }
            }
        }
    }

    post {
        failure {
            mail to: 'ops@example.invalid',
                 subject: "Build failed: \${env.JOB_NAME} #\${env.BUILD_NUMBER}",
                 body: "See \${env.BUILD_URL}"
        }
        always {
            cleanWs()
        }
    }
}
`;

export const fakeJenkinsfile: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
