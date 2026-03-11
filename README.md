# BlackJack Q-Learning

A React application that demonstrates Q-Learning algorithm applied to the game of BlackJack. The AI learns optimal strategies through reinforcement learning.

## About

Post-grad I wanted to deepen my learning and chose so in the doing of this project. In hopes of becoming more knowledgable (and amazed) in how some AI/ML algos perform, I chose to start basic with QLearning, and in used that with the notorious game of Blackjack. Whilst also strengthening my experience in developing in a live web sever, in my opinion watching live changing to your work feels best. In such also got some eexpereince in the power of Ai co-building, if thats what we want to call it.. Pretty incredible the time save and help it brings. 

All in a learning environment, this project is specifially for learning purposes.. now with that, take no advisory in the results this may bring to methods in the game of BlackJack. 

## Features

- Interactive BlackJack game
- Q-Learning implementation for AI player
- Real-time learning visualization
- Adjustable learning parameters

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```
   git clone <the url>
   cd your-repo-name
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

This project implements Q-Learning, a reinforcement learning algorithm, to teach an AI optimal strategies for playing BlackJack. In BlackJack, players aim to get as close as possible to 21 without exceeding it, competing against a dealer. The AI agent learns by playing thousands of simulated games, updating a Q-table that maps game states (player's hand value, dealer's visible card, and whether the player has an ace) to actions (hit or stand). Through trial and error with rewards (+1 for winning, -1 for losing, 0 for drawing), the AI discovers that standing on 17+ and hitting on lower values is generally optimal, mimicking expert human play. 

One thing to maybe update or add is the actin of doubling, as this move does bring significant change.

Essentially being based on statistics in determining how you should optimally play. So when you get to a high number of simulated games you start to see interesting strategy.

## Technologies Used

- React
- JavaScript


