// src/pages/Home.js
import React from 'react';
import FlipCard from '../components/FlipCard';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="content">
        <h1>TechFauna</h1>
        <p>Gestão inteligente de criações animais — dashboards, controle reprodutivo e relatórios com foco em produtividade.</p>

        <div className="card-container">
          <FlipCard
            title="Operação unificada"
            description="Recintos, indivíduos e finanças em um só painel, com filtros e visão por período."
          />
          <FlipCard
            title="Funciona offline"
            description="Registro em campo com sincronização quando houver internet."
          />
          <FlipCard
            title="Relatórios IBAMA"
            description="Gere documentos oficiais com dados consistentes do sistema."
          />
          <FlipCard
            title="Insights rápidos"
            description="Dashboards claros para decidir rápido e reduzir perdas."
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
