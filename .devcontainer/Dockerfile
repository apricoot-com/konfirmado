FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    postgresql-client \
    vim \
    nano \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Create a non-root user with sudo access
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Configure node user
RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && mkdir -p /home/$USERNAME/.cache /home/$USERNAME/.local /home/$USERNAME/.npm /home/$USERNAME/.pnpm-store \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME

# Add node user to sudoers
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set working directory
WORKDIR /workspace

# Configure pnpm store directory
ENV PNPM_HOME="/home/$USERNAME/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Switch to non-root user
USER $USERNAME

# Set default shell
SHELL ["/bin/bash", "-c"]

# Keep container running
CMD ["sleep", "infinity"]
