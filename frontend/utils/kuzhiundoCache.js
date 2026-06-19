export const kuzhiundoCache = {
  individuals: null,
  individualsTimestamp: 0,
  teams: null,
  teamsTimestamp: 0,
  clear() {
    this.individuals = null;
    this.individualsTimestamp = 0;
    this.teams = null;
    this.teamsTimestamp = 0;
  }
};
