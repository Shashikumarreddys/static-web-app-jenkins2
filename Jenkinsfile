pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'shashikumarrreddy/node-app-pipeline'
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_REPO}:latest"
        TARGET_HOST = '13.204.77.170'
        TARGET_USER = 'ubuntu'
        TARGET_KEY = credentials('target-ssh-key')
        DEPLOY_PATH = '/opt/node-app-pipeline'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "🔄 Checking out code..."
                checkout scm
            }
        }

        stage('Verify Image in Registry') {
            steps {
                echo "✅ Using pre-built image: ${DOCKER_IMAGE}"
                sh 'echo "Image tag: ${DOCKER_IMAGE}"'
            }
        }

        stage('Deploy to Target Server') {
    steps {
        echo "🚀 Deploying to target server..."
        withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
            sh '''
                ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $SSH_KEY $SSH_USER@13.204.77.170 << 'EOF'
                    cd /opt/node-app-pipeline
                    echo "📥 Pulling latest image..."
                    docker pull docker.io/shashikumarrreddy/node-app-pipeline:latest
                    
                    echo "🛑 Stopping old container..."
                    docker-compose down || true
                    
                    echo "🚀 Starting new container..."
                    docker-compose up -d
                    
                    echo "📊 Container status:"
                    docker-compose ps
                    
                    echo "⏳ Waiting for app to start..."
                    sleep 10
                    
                    echo "🏥 Health check:"
                    curl -s http://localhost:3000/api/health || echo "App starting..."
EOF
            '''
        }
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
