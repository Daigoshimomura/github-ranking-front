import React from "react";
import { RanksByLanguage } from "../../external/data/RanksByLanguage";
import { Typography, Grid, List } from "@material-ui/core";
import { RankingListItem } from "./RankingListItem";

interface RankingListProps {
  ranksByLanguage: RanksByLanguage;
}

export class RankingList extends React.Component<RankingListProps, {}> {
  render() {
    return (
      <Grid item xs={12} md={4}>
        <Typography variant="h6">
          {this.props.ranksByLanguage.language}
        </Typography>
        <div>
          <List>
            {this.props.ranksByLanguage.userInfomations.map((t, index) => (
              <RankingListItem user={t} rank={index + 1} />
            ))}
          </List>
        </div>
      </Grid>
    );
  }
}
