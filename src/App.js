import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, TrendingUp } from 'lucide-react';
import './App.css';

const BlackjackQL = () => {
  const [qTable, setQTable] = useState({});
  const [episode, setEpisode] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [showGame, setShowGame] = useState(true);
  const [speed, setSpeed] = useState(100);
  const [alpha, setAlpha] = useState(0.1);
  const [gamma, setGamma] = useState(0.9);
  const [epsilon, setEpsilon] = useState(0.1);
  const [showQTable, setShowQTable] = useState(false);

  const getCardValue = (card) => {
    if (card >= 10) return 10;
    return card;
  };

  const getStateKey = (playerSum, dealerCard, usableAce) => {
    return `${playerSum}-${dealerCard}-${usableAce ? 1 : 0}`;
  };

  const getQValue = (state, action) => {
    const key = `${state}-${action}`;
    return qTable[key] || 0;
  };

  const updateQValue = (state, action, value) => {
    const key = `${state}-${action}`;
    setQTable(prev => ({ ...prev, [key]: value }));
  };

  const chooseAction = (state) => {
    if (Math.random() < epsilon) {
      return Math.random() < 0.5 ? 'hit' : 'stand';
    } else {
      const hitQ = getQValue(state, 'hit');
      const standQ = getQValue(state, 'stand');
      return hitQ >= standQ ? 'hit' : 'stand';
    }
  };

  const drawCard = () => {
    return Math.floor(Math.random() * 13) + 1;
  };

  const calculateHandValue = (cards) => {
    let sum = 0;
    let aces = 0;

    for (let card of cards) {
      if (card === 1) {
        aces++;
        sum += 11;
      } else {
        sum += getCardValue(card);
      }
    }

    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }

    const usableAce = aces > 0;
    return { sum, usableAce };
  };

  const dealerPlay = (dealerCards) => {
    let cards = [...dealerCards];
    let { sum } = calculateHandValue(cards);
    
    while (sum < 17) {
      cards.push(drawCard());
      const result = calculateHandValue(cards);
      sum = result.sum;
    }
    
    return { cards, sum };
  };

  const playHand = (visualize = false) => {
    const playerCards = [drawCard(), drawCard()];
    const dealerCards = [drawCard(), drawCard()];
    
    let playerResult = calculateHandValue(playerCards);
    const dealerCard = dealerCards[0];

    if (visualize) {
      setGameState({
        playerCards,
        dealerCards: [dealerCard],
        playerSum: playerResult.sum,
        dealerSum: getCardValue(dealerCard),
        status: 'playing',
        usableAce: playerResult.usableAce
      });
    }

    // Track states and actions for updating Q-values
    const stateActionPairs = [];

    while (playerResult.sum < 21) {
      const state = getStateKey(playerResult.sum, dealerCard, playerResult.usableAce); // the main difference that can be noticed
      const action = chooseAction(state);
      
      stateActionPairs.push({ state, action });

      if (action === 'stand') break;

      playerCards.push(drawCard());
      playerResult = calculateHandValue(playerCards);

      if (visualize) {
        setGameState(prev => ({
          ...prev,
          playerCards: [...playerCards],
          playerSum: playerResult.sum,
          usableAce: playerResult.usableAce
        }));
      }
    }

    let reward = 0;
    let outcome = '';

    if (playerResult.sum > 21) {
      reward = -1;
      outcome = 'loss';
    } else {
      const dealerResult = dealerPlay(dealerCards);
      
      if (visualize) {
        setGameState(prev => ({
          ...prev,
          dealerCards: dealerResult.cards,
          dealerSum: dealerResult.sum,
          status: 'complete'
        }));
      }

      if (dealerResult.sum > 21 || playerResult.sum > dealerResult.sum) {
        reward = 1;
        outcome = 'win';
      } else if (playerResult.sum === dealerResult.sum) {
        reward = 0;
        outcome = 'draw';
      } else {
        reward = -1;
        outcome = 'loss';
      }
    }

    // Update Q-values for all state-action pairs (backwards through the episode)
    for (let i = stateActionPairs.length - 1; i >= 0; i--) {
      const { state, action } = stateActionPairs[i];
      const currentQ = getQValue(state, action);
      
      // For the last action, use the final reward
      // For earlier actions, use the Q-value of the next state
      let targetValue = reward;
      if (i < stateActionPairs.length - 1) {
        const nextState = stateActionPairs[i + 1].state;
        const maxNextQ = Math.max(
          getQValue(nextState, 'hit'),
          getQValue(nextState, 'stand')
        );
        targetValue = gamma * maxNextQ;
      }
      
      const newQ = currentQ + alpha * (targetValue - currentQ);
      updateQValue(state, action, newQ);
    }

    return outcome;
  };

  const trainStep = () => {
    const outcome = playHand(showGame);
    
    setStats(prev => ({
      wins: prev.wins + (outcome === 'win' ? 1 : 0),
      losses: prev.losses + (outcome === 'loss' ? 1 : 0),
      draws: prev.draws + (outcome === 'draw' ? 1 : 0)
    }));
    
    setEpisode(prev => prev + 1);
  };

  const trainFast = () => {
    setIsTraining(false);
    setShowGame(false);
    
    const newStats = { wins: 0, losses: 0, draws: 0 };
    
    for (let i = 0; i < 10000; i++) {
      const outcome = playHand(false);
      newStats.wins += outcome === 'win' ? 1 : 0;
      newStats.losses += outcome === 'loss' ? 1 : 0;
      newStats.draws += outcome === 'draw' ? 1 : 0;
    }
    
    setStats(prev => ({
      wins: prev.wins + newStats.wins,
      losses: prev.losses + newStats.losses,
      draws: prev.draws + newStats.draws
    }));
    setEpisode(prev => prev + 10000);
    setShowGame(true);
  };

  const reset = () => {
    setQTable({});
    setEpisode(0);
    setStats({ wins: 0, losses: 0, draws: 0 });
    setGameState(null);
    setIsTraining(false);
    setShowGame(true);
  };

  useEffect(() => {
    let interval;
    if (isTraining) {
      interval = setInterval(trainStep, speed);
    }
    return () => clearInterval(interval);
  }, [isTraining, qTable, speed, showGame]);

  const getCardDisplay = (card) => {
    if (card === 1) return 'A';
    if (card === 11) return 'J';
    if (card === 12) return 'Q';
    if (card === 13) return 'K';
    return card;
  };

  const winRate = stats.wins + stats.losses + stats.draws > 0 
    ? ((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100).toFixed(1)
    : 0;

  const pushRate = stats.wins + stats.losses + stats.draws > 0 
    ? ((stats.draws / (stats.wins + stats.losses + stats.draws)) * 100).toFixed(1)
    : 0;

  // Get interesting Q-table entries for display
  const getQTableSummary = () => {
    const entries = [];
    
    // Parse Q-table entries
    Object.keys(qTable).forEach(key => {
      const [state, action] = key.split('-').slice(0, -1).join('-').split('-');
      const actionType = key.endsWith('hit') ? 'hit' : 'stand';
      
      // Parse state: playerSum-dealerCard-usableAce
      const parts = key.split('-');
      if (parts.length >= 4) {
        const playerSum = parts[0];
        const dealerCard = parts[1];
        const usableAce = parts[2] === '1';
        
        const stateKey = `${playerSum}-${dealerCard}-${usableAce ? 1 : 0}`;
        
        let existing = entries.find(e => e.state === stateKey);
        if (!existing) {
          existing = {
            state: stateKey,
            playerSum: parseInt(playerSum),
            dealerCard: parseInt(dealerCard),
            usableAce: usableAce,
            hitQ: 0,
            standQ: 0
          };
          entries.push(existing);
        }
        
        if (actionType === 'hit') {
          existing.hitQ = qTable[key];
        } else {
          existing.standQ = qTable[key];
        }
      }
    });
    
    // Sort by player sum, then dealer card
    return entries.sort((a, b) => {
      if (a.playerSum !== b.playerSum) return a.playerSum - b.playerSum;
      return a.dealerCard - b.dealerCard;
    });
  };

  const qTableSummary = getQTableSummary();

  return (
    <div className="app-container">
      <div className="card">
        <h1 className="title">Q-Learning Blackjack</h1>
        <p className="subtitle">Watch the AI learn optimal blackjack strategy!</p>
        
        <div className="stats-grid">
          <div className="stat-box stat-win">
            <div className="stat-value">{stats.wins}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="stat-box stat-loss">
            <div className="stat-value">{stats.losses}</div>
            <div className="stat-label">Losses</div>
          </div>
          <div className="stat-box stat-draw">
            <div className="stat-value">{stats.draws}</div>
            <div className="stat-label">Draws</div>
          </div>
        </div>

        <div className="progress-box">
          <div className="progress-info">
            <span className="progress-label">Episodes: {episode}</span>
            <span className="progress-label">Push Rate: {pushRate}%</span>
            <span className="progress-label">Win Rate: {winRate}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${winRate}%` }}></div>
          </div>
        </div>

        {showGame && gameState && (
          <div className="game-table">
            <div className="hand-section">
              <h3 className="hand-title">Dealer ({gameState.dealerSum})</h3>
              <div className="cards-container">
                {gameState.dealerCards.map((card, i) => (
                  <div key={i} className="card-item">
                    {getCardDisplay(card)}
                  </div>
                ))}
              </div>
            </div>

            <div className="hand-section">
              <h3 className="hand-title">
                Player ({gameState.playerSum}) {gameState.usableAce && '(Soft)'}
              </h3>
              <div className="cards-container">
                {gameState.playerCards.map((card, i) => (
                  <div key={i} className="card-item">
                    {getCardDisplay(card)}
                  </div>
                ))}
              </div>
            </div>

            {gameState.status === 'complete' && (
              <div className="result-container">
                <span className="result-badge">
                  {gameState.playerSum > 21 ? 'BUST!' : 
                   gameState.dealerSum > 21 ? 'DEALER BUST!' :
                   gameState.playerSum > gameState.dealerSum ? 'WIN!' :
                   gameState.playerSum === gameState.dealerSum ? 'DRAW' : 'LOSE'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="button-row">
          <button
            onClick={() => setIsTraining(!isTraining)}
            className={`btn ${isTraining ? 'btn-pause' : 'btn-train'}`}
          >
            {isTraining ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Train</>}
          </button>
          
          <button
            onClick={trainFast}
            disabled={isTraining}
            className="btn btn-fast"
          >
            Train 10k Games
          </button>
          
          <button onClick={reset} className="btn btn-reset">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="slider-row">
          <label className="slider-label">Speed:</label>
          <input
            type="range"
            min="10"
            max="500"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-value">{speed}ms</span>
        </div>

        <div className="slider-row">
          <label className="slider-label">Learning Rate (α):</label>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-value">{alpha.toFixed(2)}</span>
        </div>

        <div className="slider-row">
          <label className="slider-label">Discount Factor (γ):</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-value">{gamma.toFixed(2)}</span>
        </div>

        <div className="slider-row">
          <label className="slider-label">Exploration (ε):</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
            className="slider"
          />
          <span className="slider-value">{epsilon.toFixed(2)}</span>
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            id="showGame"
            checked={showGame}
            onChange={(e) => setShowGame(e.target.checked)}
          />
          <label htmlFor="showGame">Show game visualization</label>
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            id="showQTable"
            checked={showQTable}
            onChange={(e) => setShowQTable(e.target.checked)}
          />
          <label htmlFor="showQTable">Show Q-Table (learned states)</label>
        </div>

        {showQTable && qTableSummary.length > 0 && (
          <div className="qtable-container">
            <h3 className="qtable-title">Q-Table: Learned States & Values</h3>
            <p className="qtable-subtitle">
              Total states learned: {qTableSummary.length} | 
              Green = prefer HIT, Blue = prefer STAND
            </p>
            <div className="qtable-grid">
              {qTableSummary.slice(0, 50).map((entry, i) => {
                const bestAction = entry.hitQ > entry.standQ ? 'hit' : 'stand';
                const confidence = Math.abs(entry.hitQ - entry.standQ).toFixed(2);
                
                return (
                  <div 
                    key={i} 
                    className={`qtable-entry ${bestAction === 'hit' ? 'prefer-hit' : 'prefer-stand'}`}
                    title={`State: ${entry.state}\nHit Q: ${entry.hitQ.toFixed(3)}\nStand Q: ${entry.standQ.toFixed(3)}`}
                  >
                    <div className="qtable-state">
                      <strong>Player: {entry.playerSum}</strong>
                      {entry.usableAce && <span className="ace-badge">A</span>}
                    </div>
                    <div className="qtable-dealer">Dealer: {entry.dealerCard}</div>
                    <div className="qtable-action">
                      {bestAction.toUpperCase()}
                    </div>
                    <div className="qtable-values">
                      H: {entry.hitQ.toFixed(2)} | S: {entry.standQ.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
            {qTableSummary.length > 50 && (
              <p className="qtable-more">...and {qTableSummary.length - 50} more states</p>
            )}
          </div>
        )}

        <div className="info-box">
          <h3 className="info-title">
            <TrendingUp size={18} /> How it works:
          </h3>
          <ul className="info-list">
            <li>The agent learns by playing thousands of blackjack hands</li>
            <li>It tracks Q-values for hitting or standing in each situation</li>
            <li>The state includes: player sum, dealer's card, and if player has usable ace</li>
            <li>Over time, it discovers optimal strategy (similar to basic strategy charts!)</li>
          </ul>
          <h3 className="info-title" style={{marginTop: '16px'}}>
            Parameter Tips:
          </h3>
          <ul className="info-list">
            <li><strong>α (Learning Rate):</strong> Higher = faster learning but less stable (try 0.3-0.5)</li>
            <li><strong>γ (Discount):</strong> How much future rewards matter (0.9-0.95 is good)</li>
            <li><strong>ε (Exploration):</strong> Lower = more exploitation of learned strategy (try 0.05 after training)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlackjackQL;