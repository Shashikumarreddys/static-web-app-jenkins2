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

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh '''
                    docker build -t ${IMAGE_TAG} -t ${LATEST_TAG} -f Dockerfile .
                    docker images | grep node-app-pipeline
                '''
            }
        }

        stage('Push to Docker Registry') {
            steps {
                echo "📤 Pushing image to Docker registry..."
                sh '''
                    echo "${DOCKER_CREDENTIALS_PSW}" | docker login -u "${DOCKER_CREDENTIALS_USR}" --password-stdin
                    docker push ${IMAGE_TAG}
                    docker push ${LATEST_TAG}
                    docker logout
                '''
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
                        mkdir -p ${DEPLOY_PATH}
                        cd ${DEPLOY_PATH}
                        docker pull ${IMAGE_TAG}
                        docker-compose down || true
                        docker-compose up -d
                        docker-compose ps
                        sleep 10
                        curl -s http://localhost:3000/api/health || echo "Health check pending..."
EOF
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f ~/.ssh/deploy_key || true'
        }

        success {
            echo "✅ Pipeline succeeded!"
        }

        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
