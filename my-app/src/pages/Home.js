// src/pages/Home.js
import React from 'react';
import FlipCard from '../components/FlipCard';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="content">
        <h1>Bem-vindo à Fauna Tech</h1>
        <p>Explore mais sobre o sistema e suas funcionalidades!</p>
        <div className="card-container">
          <FlipCard
            title="Tecnologia e Fauna"
            description="Explore como a tecnologia pode auxiliar na preservação e monitoramento da fauna ao redor do mundo."
          />
          <FlipCard
            title="Monitoramento Inteligente"
            description="Utilizando sensores e IA, é possível acompanhar o comportamento animal e seu ambiente natural em tempo real."
          />
          <FlipCard
            title="Conservação com Dados"
            description="Big Data e análises preditivas são utilizados para mapear áreas de risco e implementar ações de preservação."
          />
          <FlipCard
            title="Inovações Tecnológicas"
            description="Robôs e drones estão sendo usados para coletar dados em locais inacessíveis, facilitando a preservação de espécies em extinção."
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
