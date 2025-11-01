pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'shashikumarrreddy/node-app-pipeline'
        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        TARGET_HOST = credentials('target-host')
        TARGET_KEY = credentials('target-ssh-key')
        DEPLOY_PATH = '/opt/node-app-pipeline'
        BUILD_TAG = "${BUILD_NUMBER}"
        IMAGE_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:${BUILD_TAG}"
        LATEST_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:latest"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "🔄 Checking out code..."
                checkout scm
            }
        }

        stage('Deploy to Target Server') {
            when {
                branch 'main'
            }
            steps {
                echo "🚀 Deploying to target server..."
                sh '''
                    mkdir -p ~/.ssh
                    echo "${TARGET_KEY}" > ~/.ssh/deploy_key
                    chmod 600 ~/.ssh/deploy_key
                    
                    SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ~/.ssh/deploy_key"
                    
                    ssh ${SSH_OPTS} ubuntu@${TARGET_HOST} << 'EOF'
                        mkdir -p /opt/node-app-pipeline
                        cd /opt/node-app-pipeline
                        docker pull docker.io/shashikumarrreddy/node-app-pipeline:latest
                        docker-compose down || true
                        docker-compose up -d
                        docker-compose ps
EOF
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f ~/.ssh/deploy_key || true'
        }
    }
}
